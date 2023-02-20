---
title: 设计基于 Redis 的定时任务系统（ZSET + Scripting）
alias: redis-cronjob-system
date: 2019-08-19
tags:
  - Node.js
  - Redis
---

这篇文章会带领大家实现一个基于 Redis 的分布式高可用定时任务系统，其中的 worker 以 Node.js 为例，但其实可以使用任何语言来实现。这篇文章不会给出完整的代码，更侧重于探索的过程。

## 高可用设计
首先我们希望让 worker 是无状态的，这样会大幅减少对于 worker 的高可用需求，也不涉及到 worker 之间的数据同步或者选举。我们将所有的状态集中到 Redis 上，Redis 可以用 Master-Slave + Sentinel 的方式达到一个相对较高的可用性。

**为什么不使用选举 Master 的方式？**

有一种很常见的做法是在单个实例上完成所有的工作，这样甚至连 Redis 都不需要了。但为了保证高可用，往往会同时启动多个实例，然后引入一个「选举」的过程来决定谁是那个完成所有工作的人（称为 master），在 master 失效后，则需要重新进行选举，选出另外一个 master。

简单来说我觉得这种做法不够「分布式」，只有一个 master 在工作，其他实例只是热备而已，同时选举和对 master 失效的监测也是一个非常麻烦的事情。而在我们的方案中所有的 worker 都是平等的，都在执行任务，可以在任意时候创建或移除 worker。

## 核心循环
对于一个定时任务系统来说，核心的工作是给定时任务们按时间排序，然后找到并等待下一个需要触发的任务。Redis 刚好为我们提供了 [ZSET](https://redis.io/topics/data-types#sorted-sets) 这种支持排序的集合类型，ZSET 中存储着若干个互不相同的 member（字符串或二进制数据），每个 member 有一个相关联的 score（数字），整个 ZSET 会按照 score 排序，基于这样的数据结构提供了若干操作。

我们将定时任务的 ID 作为 member 放在一个叫 `cronjobs` 的 ZSET 里，使用下次触发时间作为 score 来排序，这样便得到了一个以下次触发时间排序的列表。

我们可以这样向系统中添加任务：

```js
redisClient.zadd('cronjobs', nextTriggerAt(cronjobId), cronjobId)
```

用 `ZRANGE cronjobs 0 -1 WITHSCORES` 可以看到已添加的任务：

```
127.0.0.1:6379> ZRANGE cronjobs 0 -1 WITHSCORES
1) "2"
2) "1565453967832"
3) "1"
4) "1565453998742"
```

然后我们可以在 worker 中写一个无限循环，不断地检查这个 ZSET 中 score 最小（触发时间最早）的任务是否已经超过了当前时间，如果是的话就执行这个任务，并修改 ZSET 中的 score 为下次触发时间，Node.js 的代码如下：

```js
while (true) {
  const [cronjobId, triggerAt] = await redisClient.zrange('cronjobs', 0, 0, 'WITHSCORES')

  if (parseInt(triggerAt) < Date.now()) {
    // ZADD CH 会返回被修改 member 数量，只有当成功修改了 score 我们才会继续执行，否则说明这个任务已经被其他的 worker 执行了
    if (await redisClient.zadd('cronjobs', 'CH', nextTriggerAt(cronjobId), cronjobId)) {
      // 异步地运行任务，避免「阻塞」核心循环
      runJob(cronjobId)
    }
  } else {
    // 等待下一个任务触发，如果距离下一个任务的触发少于 10 秒，则等待下一个任务执行，否则等待 10 秒后重试。
    await bluebird.delay(triggerAt ? Math.min(parseInt(triggerAt) - Date.now(), 10000) : 10000)
  }
}
```

上面的循环构成了这个定时任务系统最核心的部分，后面我们会逐渐地完善他。

**为什么不用 Keyspace Notifications?**

在社区中有很多文章推荐简单地使用 Keyspace Notifications 来实现「定时」，即为一个 key 设置一个过期时间，然后订阅这个 key 过期的事件。但这种方式主要的问题是 Redis 的 Pub/Sub 并不保证送达，如果刚好在这个 key 过期时 worker 不在线，那么这一次触发就不会生效；如果刚好有多个 worker 在线，那么这一次触发的任务也可能被执行多次。

而我们选择的基于 ZSET 的方式，需要 worker 主动修改 ZSET 中的下次触发时间，即使 worker 暂时不可用，在恢复时也会继续执行之前剩余的任务。

**这样 Redis 就变成了系统的单点？**

是这样的，这个系统中几乎全部的状态都存储于 Redis 上，可以说是系统中的单点。但相比于 worker，Redis（或其他的数据库）是一个更稳定、更标准化的组件。你可以用官方的 Master-Slave + Sentinel 方案来达到一个相对较高的可用性，你也可以使用由云服务厂商提供的托管 Redis 产品，避免自己来维护它。

## 继续完善
### CRON 表达式
前面的代码中我们并没有实现 nextTriggerAt，你可以用 cron-parser 这样的库去解析 CRON 表达式，计算下次触发时间：

```js
const cronParser = require('cron-parser')

async function nextTriggerAt(cronjobId) {
  // 从 Redis 或其他数据库中根据 cronjobId 拉取定时任务的详情
  const cronjobInfo = await getCronjobInfo(cronjobId)
  return cronParser.parseExpression(cronjobInfo.cron).next().getTime()
}
```

### 中断任务处理
如果一个 Worker 意外退出，那么当时正在被它处理的所有任务都会永久性地丢失。为了避免这种情况，我们将正在执行的任务也存储到 Redis 中（一个叫 `running` 的 ZSET）：

```js
if (await redisClient.zadd('cronjobs', 'CH', nextTriggerAt(cronjobId), cronjobId)) {
    // 为每个任务生成一个随机的 uuid 以便能单独地追踪每个任务，例如打印到日志中
  await redisClient.zadd('running', Date.now() + 60000, `${cronjobId}:${uuid.v4()}`)
  runJob(cronjobId).finally( () => {
    // 在一个任务被完成时，我们还需要将它从 running 集合中取出
    redisClient.zrem('running', uniqueId)
  })
 }

```

如果你有一些为多实例应用编写代码的经验，那么可能会注意到这里存在一个竞态条件：对 cronjobs 和 running 的操作并不是原子的，可能会出现对 cronjobs 的操作成功了，随即 worker 意外退出，没有来得及写入 running 的情况。

因为这里我们需要对 ZADD 的返回值做判断，所以不能简单地使用 Redis 的 Pipeline 功能，而是要用到 Lua Script：

```js
redisClient.defineCommand('startJob', {
  lua: `
    local cronjobId = ARGV[1]
    local jobName = ARGV[2]
    local nextTriggerAt = tonumber(ARGV[3])
    local timeoutAt = tonumber(ARGV[4])

    local changed = redis.call('ZADD', 'cronjobs', 'CH', nextTriggerAt, cronjobId)

    if changed ~= 0 then
      redis.call('ZADD', 'running', timeoutAt, jobName)
    end

    return changed
  `
})
```

经过修改后的核心循环：

```js
const jobName = `${cronjobId}:${uuid.v4()}`

if (await redisClient.startJob(cronjobId, jobName, nextTriggerAt(cronjobId), Date.now() + 60000)) {
  runJob(cronjobId).finally( () => {
    redisClient.zrem('running', uniqueId)
  })
}
```

然后我们便可以添加另外一个循环，从 running 中拉取已经超时的任务进行重试或其他处理，这里不再给出具体的代码。

**Lua Script**

Lua Script 是 Redis 提供的一种类似事务能力，Redis 保证每个 Lua Script 都是串行执行的，中途不会有其他指令被执行，这提供了一种非常强的一致性保证。在实际的开发中，我们可以将需要一致性保证的逻辑写成 Lua Script。

### 平滑关闭
我们不可避免地会对 worker 进程进行新版本的部署或其他维护，因此我们需要一种平滑的方式来关闭 worker 进程，让它继续执行已经收到的任务，但不去接受新的任务，在执行完当前的任务之后，主动退出。

在 Unix 中最正统的方式是实现自定义的 SIGINT 处理器来实现这个功能，即由终端模拟器、进程管理器或容器平台向程序发送 SIGINT 信号，程序即开始进行退出前的清理工作，然后待清理工作结束后，程序主动退出。当然进程管理器也有可能等不及，再发送一个强制结束的 SIGKILL。

所以我们需要将所有正在执行的任务注册到一个全局的 Promise 数组中，然后在受到 SIGINT 时停止接受新任务，并等待所有正在执行的任务完成后主动退出：

```js
let runningJobs = []
let shuttingDown = false

process.on('SIGTERM', () => {
  shuttingDown = true

  // 等待 runningJobs 中所有的任务完成，无论成功还是失败
  Promise.all(runningJobs.map( p => p.catch(() => {}) )).then( () => {
    process.exit(0)
  })
})

```

修改核心循环，在开始任务时将 runJob 返回的 Promise 存入 runningJobs，然后在任务执行完时取出：

```js
while (true) {
  if (shuttingDown) {
    break
  }

  // ...

  if (await redisClient.zadd('cronjobs', 'CH', nextTriggerAt(cronjobId), cronjobId)) {
    // 异步地运行任务，避免「阻塞」核心循环
    const jobPromise = runJob(cronjobId)

    jobPromise.finally( () => {
      _.pull(runningJobs, jobPromise)
    ))

    runningJobs.push(jobPromise)
  }

  // ...
}
```

### 容量的横向拓展
目前这个定时任务系统中的 worker 是可以无限拓展的，但 Redis 却是整个系统中的瓶颈，每个 worker 都需要从 Redis 获取任务来执行。按照我们对于 Redis 通常  70k QPS 的估计，按每个任务需要执行 5 个命令计算，整个系统可以支持每秒 14k 次任务触发，对于绝大部分的场景其实完全够用了。

如果要继续拓展的话，我的建议是根据业务上的一些区分（例如用户、任务类型）将队列分散到不同的 Key 上面（例如 `userA:cronjobs` 和 `userB:cornjobs`），这样便可以利用 Redis Cluster 的分片功能来进行扩展了。

## 小结
我们用 ZSET 将定时任务按照触发时间排序，然后使用一个无限循环来拉取需要触发的任务，实现了一个分布式定时任务系统的核心部分，读者可以在此基础上根据自己的需要做进一步扩展。

本文甚至没有给出完整的代码，因此并不能直接地复制到你的项目中使用，更多地在于提出和讨论一种解决方案。社区中也有一些类似的开源组件可供选用，例如 [Bull](https://github.com/OptimalBits/bull) 是一个功能完整的任务队列，其中包括了定时任务功能，Bull 使用了和本文类似的 ZSET + Scripting 技术，使用 Redis 作为后端。
