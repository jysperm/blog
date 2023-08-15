---
title: 'Node.js 错误处理实践'
tags:
  - Node.js
alias: nodejs-error-handling
date: 2016-10-03
---

> 这篇文章由我九月末在 [Node Patry 杭州](https://github.com/Hangzhou-Node-Party/slides) 进行的一次技术分享整理而来。

今天我想介绍的是 Node.js 开发中一个很小，但又很重要的话题 —— 错误处理。作为一名软件工程师，我想我们应该都会认可「错误是无法避免的」，因此我们必须积极地去对待这些错误，才能写出健壮的代码。

首先，我想先介绍一下我们理想的错误处理是什么样的：

* 出现错误时能将任务中断在一个合适的位置
* 能记录错误的摘要、调用栈及其他上下文
* 通过这些记录能够快速地发现和解决问题

通常一个大的任务是由很多小的步骤构成的，很多时候当一个步骤中发生了错误，你并不能放任它在这里中断。我又要举那个经典的例子了：两个人，A 向 B 转账，当从 A 的账户扣完钱要加到 B 的账户上的时候发生了错误，这时显然你不能让整个任务中断在这里，否则就会出现数据的不一致 —— A 的账户被扣了钱但没有被加到其他任何账户上。因此我们需要通过错误处理精心地控制错误中断的位置，在必要的情况下回滚数据，确保数据的一致性。

我们的程序也需要在出现错误的情况下能够显示（或记录）一个错误的摘要、调用栈，以及其他的上下文。调用栈通常语言本身会提供，但很多时候仅有调用栈是不足以定位问题的，所以我们还需要去记录那些可能与这个错误有关的「上下文」，比如当时某几个关键的变量的值。对于一个服务器端项目，如果我们决定不向用户展示错误的详情，可能还需要为用户提供一个唯一的错误编号，以便用户事后反馈的时候我们可以根据编号还原当时的现场。

我也要举一些反面的例子，我们不希望错误处理是这样的：

* 出现错误后程序崩溃退出
* 出现错误后 HTTP 请求无响应
* 出现错误后数据被修改了「一半」，出现不一致
* 出现错误后没有记录日志或重复记录
* 在日志中打印了错误但没有提供调用栈和上下文

在 Node.js 程序中经常会出现 HTTP 请求无响应的情况 —— 既没有收到成功响应，也没有收到失败响应，一直在保持着连接。这通常是由于回调函数中的代码抛出了一个异常但没有被正确地捕捉，导致对这个请求的处理流程被意外地中断了，后面我们会介绍如何写出健壮的异步代码。

有的数据库会提供回滚事务的功能，但有的时候我们在使用非事务的数据库，或者在操作临时文件或其他的外部资源，这时就需要我们自己在出现错误的时候来回滚数据了。

出现错误有没有记录或记录不全也是一个非常糟糕的情况，这会让你无从定位错误，你不得不去排查代码的每一个路径，通过用日志打点的方式排查错误发生在哪里；或者虽然打印了错误但没有调用栈或上下文，这也会给你定位错误带来一些不便；再或者一旦一个错误发生了，整个程序里所有相关的函数调用都在打印这个错误，造成日志被错误刷屏，虽然不是大问题，但也会让人感到烦躁。

## 层次化架构

前辈们说过「计算机领域内的任何问题都可以通过添加一个抽象层的方法来解决」，当我们需要维护一个规模较大的项目时，通常会选择一种层次化的架构：

![](https://r2-lc-cn.jysperm.me/pictures/2016/layers.png)

其实我们通常提到的 MVC 就算是一种层次化架构，但我在这里展示了一个更为通用的架构：左侧的 Dispatcher 指程序的入口点，对于 Web 后端来说可能是解析 HTTP 请求，分发到对应处理函数的部分；对于 GUI 程序来说可能是接受用户输入的部分；对于命令行程序来说可能是解析命令行参数的部分。

在来自外部的任务被 Dispatcher 转换为内部表示之后，会进入到业务逻辑层，这部分是一个程序最复杂也是最核心的部分，它的内部可能还会被划分为若干个小的模块和层次。

最后，我觉得无论是什么程序，最后都要去操作数据，这就是图中的 Date Access 层。对于服务器端程序来说可能会直接连接到一个数据库；对于客户端程序来说可能会使用一个 HTTP Client 去操作远程的数据。

那么如果在这样一个复杂的层次化架构中，某个环节发生了错误怎么办？我们很可能会面临一个问题：**我们在某一个层级可能没有足够的信息去决定如何处理这个错误**。例如在 Data Access 层，一个数据库查询发生了错误，在 Data Access 这一层我们并不知道这个失败的查询对于更上层的业务逻辑意味着什么，而仅仅知道这个查询失败了。

所以我们需要有一种机制，**将错误从底层不断地向上层传递，直到错误到达某个层级有足够的信息去决定如何处理这个错误**。例如一个数据库查询的失败，根据不同的业务逻辑，可能会采取忽略、重试、中断整个任务这些完全不同的处理方式。

## 异常

好在 JavaScript 为我们提供了异常（Exception）这样一个特性。异常是现代的高级语言所提供的一种非常强大的流程控制机制，我说它是流程控制机制，是说它和 if-else、for、while 其实是差不多的，都是用来进行流程控制的。异常让原本唯一的、正确的执行路径变得可以从任何一处中断，并进入一个所谓的「异常处理流程」。

```javascript
try {
  step1();
} catch (err) {
  console.error(err.stack);
}

function step1() {
  // ...
  step2()
  // ...
}

function step2() {
  if ( ... )
    throw new Error('some error');
}
```

在前面的例子中，我们定义了 step1 和 step2 两个函数，step1 调用了 step2，而 step2 中有可能抛出一个异常。我们仅需将对 step1 的调用放在一个 try 的语句块里，便可在后面的 catch 块中捕捉到 step2 抛出的异常，而不需要在 step1 和 step2 中进行任何处理 —— 即使它们再调用了其他函数。

这是因为异常会随着调用栈逆向地回溯，然后被第一个 catch 块捕捉到。这恰好符合我们前面提到的需求：在某个较底层（调用层次较深）的函数中我们没有足够的信息去处理这个错误，我们便不必在代码中特别地处理这个错误，因为异常会沿着调用栈回溯，直到某个层次有信息去处理这个异常，我们再去 catch, 一旦一个异常被 catch 了，便不会再继续回溯了（除非你再次 throw），这时我们称这个异常被处理了。

> P.S. 下文中我们会同时使用「错误」和「异常」这两个词，它们之间的差别比较微妙：错误通常用来表示广义的不正确、不符合预期的情况；异常则具体指 JavaScript 或其他很多语言中提供的一种流程控制机制，以及在这个机制中被传递的异常对象。

也有很多语言是没有异常的支持的，例如 C 和 Golang, 让我们来想象一下没有异常的 JavaScript 会是什么样子：

```javascript
var err = step1();
if (err) console.error(err);

function step1() {
  // ...
  var err = step2();
  if (err) return 'step1: ' + err;
  // ...
}

function step2() {
  if ( ... )
    return 'step2: some error';
}
```

如果没有异常，每个函数都必须提供一种方式，告诉它的调用者是否有错误发生，在这里我们选择通过返回值的方式来表示错误，即如果返回空代表执行成功，返回了非空值则表示发生了一个错误。可以看到在每一次函数调用时，我们都需要去检查返回值来确定是否发生了错误，如果有错误发生了，就要提前中断这个函数的执行，将同样的错误返回。如果 step1 或 step2 中再去调用其他的函数，也需要检查每个函数的返回值 —— 这是一项非常机械化的工作，即使我们不去处理错误也必须手动检查，并在有错误时提前结束。

语言内建的异常还提供了另外一项非常有用的功能，那就是调用栈：

```
Error: some error
    at step2 (~/exception.js:14:9)
    at step1 (~/exception.js:9:3)
    at <anonymous> (~/exception.js:2:3)
```

这是前面的例子中打印出的调用栈，调用栈中越靠上的部分越接近异常实际产生的位置，而下面的调用栈则会帮助我们的还原程序执行的路径。调用栈是 JavaScript 引擎为我们提供的功能，如果没有异常的话，恐怕就需要我们自己来维护调用栈了。

## 抛出一个异常

我在这里把异常粗略地分为两类：

* 预期的异常：参数不合法、前提条件不满足
* 非预期的异常：JavaScript 引擎的运行时异常

预期的异常通常是我们在代码中主动抛出的，目的是为了向调用者报告一种错误，希望外部的逻辑能够感知到这个错误，在某些情况下也可能是希望外部的逻辑能够给用户展示一个错误提示。

非预期的异常通常说明我们的程序有错误或者考虑不周到，比如语法错误、运行时的类型错误。或者也可能是来自依赖的库的错误，在实践中我们通常会把来自依赖库中的错误，捕捉后再次以特定的格式抛出，将其简单地「转化」为预期的异常。

那么，如果我们要主动抛出一个异常，应该怎样做呢：

* 总是抛出一个继承自 Error 的对象
* 慎用自定义的异常类型
* 可以直接向异常上附加属性来提供上下文

首先你应该总是抛出一个继承自 JavaScript 内建的 Error 类型的对象，而不要抛出 String 或普通的 Object, 因为只有语言内建的 Error 对象上才会有调用栈，抛出其他类型的对象将可能会导致调用栈无法正确地被记录。同时也要慎重地使用自定义的异常类型，因为目前 JavaScript 中和调用栈有关的 API（如 `Error.captureStackTrace`）还不在标准中，各个引擎的实现也不同，你很难写出一个在所有引擎都可用的自定义异常类型。因此如果你的代码可能会同时运行在 Node.js 和浏览器中，或者你在编写一个开源项目，那么建议你不要使用自定义的异常类型；如果你的代码不是开源的，运行环境也非常确定，则可以考虑使用引擎提供的私有 API 来自定义异常类型。

另外这里的建议不仅适用于传递给 throw 关键字的异常对象，也适用于传递给 callback 函数的第一个参数。

前面我们几次提到「上下文」的这个概念，所谓上下文就是说和这个错误有关的一些信息，这个「有关」可能是非常主观的，即你觉得那些有助于你定位错误的信息。借助于 JavaScript 灵活的类型机制，我们可以向任意对象上附加任意的属性，异常对象也不例外：

```javascript
var err = new Error('Permission denied');
err.statusCode = 403;
throw err;

var err = new Error('Error while downloading');
err.url = url;
err.responseCode = res.statusCode;
throw err;
```

前面一个例子中，当一个请求无权限访问数据时，我们在抛出的异常对象上添加了一个 `statusCode = 403` 的属性，这个属性将会提示最终处理这个错误的 HTTP 层代码，给客户端发送 409 的错误响应；后面一个例子是在下载一个文件时发生了错误，当出现了这样的情况，显然我们最感兴趣的会是下载的地址是什么、服务器发回了怎样的响应，所以我们选择将这两个信息附加到异常对象上，供外层的逻辑读取。

## 异步任务

目前为止我们提到的都是 JavaScript 语言内建的异常特性，但因为语言内建的异常是基于调用栈的，所以它只能在「同步」的代码中使用。当我们刚刚入门 Node.js 时经常会搞不清这一点：「异步」任务是通过所谓的「事件队列」来实现的，每当引擎从事件队列中取出一个回调函数来执行时，实际上这个函数是在调用栈的最顶层执行的，如果它抛出了一个异常，也是无法沿着调用栈回溯到这个异步任务的创建者的。

所以你无法在异步代码中直接使用 try ... catch 来捕捉异常，因此接下来我们会介绍如何在异步的代码中使用类似异常的机制来处理错误，在这里我粗略地将 Node.js 中常见的异步流程控制机制分为下面三大类：

* Node.js style callback
* Promise（co、async/await）
* EventEmitter（Stream）

首先是影响了几乎所有 Node.js 程序员的 Node.js style callback:

```javascript
function copyFileContent(from, to, callback) {
  fs.readFile(from, (err, buffer) => {
    if (err) {
      callback(err);
    } else {
      try {
        fs.writeFile(to, buffer, callback);
      } catch (err) {
        callback(err);
      }
    }
  });
}

try {
  copyFileContent(from, to, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('success');
    }
  });
} catch (err) {
  console.error(err);
}
```

我们在这里以一个 copyFileContent 函数为例，它从第一个参数所代表的源文件中读取内容，然后写入到第二个参数所代表的目标文件。

首先需要注意的是在每次回调中，我们都需要去检查 err 的值，如果发现 err 有值就代表发生了错误，那么需要提前结束，并以同样的错误调用 callback 来将错误传递给调用者。

然后在回调中的代码也必须要包裹在 try ... catch 中来捕捉同步的异常，如果捕捉到了同步的异常，那么也需要通过 callback 将错误传递给调用者。这里是一个比较大的坑，很多人会忘记，但按照 Node.js style callback 的风格，一个函数既有可能同步地抛出一个异常，也有可能异步地通过 callback 报告一个错误，Node.js 标准库中的很多函数也是如此。

在使用这个 copyFileContent 时，我们也需要同时去捕捉同步抛出的异常和异步返回的错误，实际上这样导致了错误情况下的逻辑分散到了两处，实在让人有些难以接受。

我们来总结一下使用 Node.js style callback 时琐碎的细节：

* 需要同时处理同步的异常和异步的回调
* 在每次回调中需要检查 err 的值
* 回调中的代码也需要捕捉同步异常

最后确保：无论成功或失败，要么 callback 被调用，要么同步地抛出一个异常。

我们需要在每个回调中检查 err 的值，如果有值就立刻调用 callback 并不再执行接下来的逻辑，确保错误被传递给调用者。仔细想想，这个做法和我们一开始展示的「没有异常的 JavaScript」是多么地相似！我们必须手动地去完成错误的传递工作，而且中间有很多容易被遗漏的琐碎细节。这也是为什么后来 Promise 得到了大家的认可，逐步取代了 Node.js style callback.

那么为什么 Node.js 会选择 callback style 而不是 Promise 作为标准库的接口呢？很大程度上是因为在 Node.js 刚刚发布时，Promise 还未进入 ECMAScript 的标准，Node.js 认为标准库应该提供最简单、最基本的接口，而使用 Promise 意味着 Node.js 还需要在标准库中内建一个 Promise 的实现，引入了额外的复杂度。如果用户希望使用 Promise 风格的标准库，大可以自己封装一个或选择第三方的封装，而标准库本身依然提供着最「简单」的接口。

所以接下来我们来看 Promise:

```javascript
function copyFileContent(from, to) {
  return fs.readFile(from).then( (buffer) => {
    return fs.writeFile(to, buffer);
  });
}

Promise.try( () => {
  return copyFileContent(from, to);
}).then( () => {
  console.log('success');
}).catch( (err) => {
  console.error(err);
});
```

Promise 可以说是对同步任务和异步任务的一种一致的抽象，算是 Node.js 中异步流程控制的未来趋势，今天我们不过多介绍 Promise, 而是着重来看它对于错误处理的影响。

Pormise 的版本相比于前面的 Node.js style callback 要短了许多，主要是我们不需要在 copyFileContent 中处理错误了，而只需要去考虑正常的流程。`fs.readFile`、`fs.writeFile` 和 copyFileContent 的返回值都是一个 Promise, 它会帮助我们传递错误，在 Promise 上调用 `.then` 相当于绑定一个成功分支的回调函数，而 `.catch` 相当于绑定一个失败分支的错误处理函数，实际上我们的代码已经非常类似于语言内建的异常机制了。

我也要介绍一些在使用 Promise 过程中的最佳实践，首先是要尽量避免手动创建 Promise:

```javascript
function copyFileContent(from, to) {
  return new Promise( (resolve, reject) => {
    fs.readFile(from, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        try {
          fs.writeFile(to, buffer, resolve);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}
```

Promise 也有一个构造函数，通常用于将一段 Node.js style callback 风格的逻辑封装为 Promise, 在其中你需要手动在成功或失败的情况下调用 resolve 或 reject, 也需要手动处理 Node.js style callback 中各种琐碎的细节，十分容易出现疏漏。

取而代之的是，我们应该使用类似于 bluebird 提供的 `Promise.promisify` 这样的函数自动地帮我们完成转换，`Promise.promisify` 接受一个 Node.js style callback 风格的函数然后帮助我们自动转换到返回 Promise 的函数，虽然其内部和我们前面手动转换的例子差不多，但使用它可以避免直接面对复杂的转换逻辑，减少犯错的可能性：

```javascript
function copyFileContent(from, to) {
  return Promise.promisify(fs.readFile)(from).then( (buffer) => {
    return Promise.promisify(fs.writeFile)(to, buffer);
  });
}
```

至于 co/generator 和 async/await，我觉得它们和 Promise 并没有什么本质上的区别，而且它们最后也提供了和 Promise 相兼容的 API, 因此接下来我们只是简单地一笔带过。

generator 提供了一种中断函数的执行而后再继续的能力，这种能力让它可以被用作异步流程控制：

```javascript
var copyFileContent = co.wrap(function*(from, to) {
  return yield fs.writeFile(to, yield fs.readFile(from));
});

co(function*() {
  try {
    console.log(yield copyFileContent(from, to));
  } catch (err) {
    console.error(err);
  }
});
```

而 async/await 则是基于 generator 的进一步优化，使代码更加简洁而且具有语义：

```javascript
async function copyFileContent(from, to) {
  return await fs.writeFile(to, await fs.readFile(from));
}

try {
  console.log(await copyFileContent(from, to));
} catch (err) {
  console.error(err);
}
```

通常来说一个返回 Promise 的函数也有可能同步地抛出一个异常，这也是为什么前面的代码我用了一个 `Promise.try`，如果你的代码已经在一个 Promise 的 `.then` 里，那你就不必去加 `Promise.try` 了，甚至也不需要为每一个 Promise 添加 `.catch`，而是让它自动地向上层抛出，这和 Node.js style callback 有着本质的区别，下面我们来展示一个更复杂一些的例子：

```javascript
Promise.try( () => {
  return copyFileContent(a, b);
}).then( () => {
  return copyFileContent(b, c);
}).then( () => {
  return copyFileContent(c, d);
}).then( () => {
  console.log('success');
}).catch( (err) => {
  console.error(err);
});
```

这里我们将文件复制了三次，在主逻辑中我们依然没有去关心错误的情况，因为任何一个步骤发生了错误，都会到达最后的 catch 块中，这就是所谓的 Pormise chain, 但需要注意的是记得要在每个「返回 Promise 的函数」中添加 return, 否则调用者没有办法感知到你返回了一个 Promise.

语言内建的同步异常提供了调用栈，那么通过 Promise 传递的异步异常的调用栈会是什么样子的呢：

```
Error: EACCES: permission denied, open 'to'
    at Error (native)
```

就像我们前面提到的那样，我们只能看到来自 JavaScript 引起的调用，而看不到这个异步任务的创建者。但实际上很多 Promise 的实现提供了一个「记录异步调用栈」的功能，当开启了这个选项之后：

```
Error: EACCES: permission denied, open 'to'
    at Error (native)
From previous event:
    at ~/test.js:15:15
    at FSReqWrap.readFileAfterClose(fs.js:380:3)
From previous event:
    at copyFileContent (~/test.js:14:28)
    at ~/test.js:20:10
```

我们便可以看到创建这个异步任务的行号和更多的调用栈了，虽然这个选项对性能有一定影响，但我仍然建议开启这个选项，它将会很大程度上加快你定位线上错误的速度。

那么 Node.js style callback 是否有能力记录这样的异步调用栈呢？我的答案是不能，因为在 Node.js style callback 中，我们是直接在使用调用者传递进来的 callback, 中间没有任何的胶合代码允许我们插入记录调用栈的逻辑，除非手动在每一次调用时去添加调用栈，这样便会对业务代码产生侵入式的影响。而在 Promise 中，所有异步任务的回调都被包裹在一个 `.then` 中，异步调用都是间接地通过 Promise 完成的，这给了 Promise 实现记录异步调用栈的机会，而不会影响到业务代码。

当大家在争论 Promise 和 asycn/await 谁才是未来的时候，可能忘记了 Node.js 还有个 events 模块，提供了基于事件的异步流程控制机制。如果说 Node.js style callback 和 Promise 都是一个操作对应一个结果的话，那么 EventEmitter 则提供了一个操作（甚至没有操作）对应多个结果的异步模型：

```javascript
var redisClient = redis.createClient();

redisClient.on('error', (err) => {
  console.error(err);
});
```

EventEmitter 提供了一种基于事件的通知机制，每个事件的含义其实是由使用者自己定义的，但它对于 error 事件却有一些特殊处理：如果发生了 error 事件，但却没有任何一个监听器监听 error 事件，EventEmiter 就会把这个错误直接抛出 —— 通常会导致程序崩溃退出。

标准库里的很多组件和一些第三方库都会使用 EventEmitter, 尤其是例如数据库这类的长链接，我们要确保监听了它们的 error 事件 —— 哪怕是打印到日志中。其实这里也比较坑，因为当我们在使用第三方库的时候，除非文档上写了，否则我们可能并不知道它在哪里用到了 EventEmitter（有的库可能有多个地方都用到了）。

Node.js 中的 Stream 也是基于 EventEmitter 的：

```javascript
try {
  var source = fs.createReadStream(from);
  var target = fs.createWriteStream(to);

  source.on('error', (err) => {
    console.error(err);
  }).pipe(target).on('error', (err) => {
    console.error(err);
  });
} catch (err) {
  console.error(err);
}
```

在上面的例子中，我创建了一个读文件的流和一个写文件的流，并将读文件的流 `.pipe` 到写文件的流，实现一个复制文件内容的功能。我们一开始看到 pipe 这个函数，可能会以为它会将前面的流的错误一起传递给后面的流，然后仅需在最后加一个 error 事件的处理器即可。但其实不然，我们需要去为每一个流去监听 error 事件。

如果有异常没有捕捉到怎么样？如果有一个异常一直被传递到最顶层调用栈还没有被捕捉，那么就会导致进程的崩溃退出，不过我们还有两个终极捕捉手段：

```javascript
process.on('uncaughtException', (err) => {
  console.error(err);
});

process.on('unhandledRejection', (reason, p) => {
  console.error(reason, p);
});
```

uncaughtException 事件可以捕捉到那些已经被抛出到最顶层调用栈的异常，一旦添加了这个监听器，这些异常便不再会导致进程退出。实际上有一些比较激进的人士认为程序一旦出现事先没有预料到的错误，就应该立刻崩溃，以免造成进一步的不可控状态，也为了提起开发人员足够的重视。但我从比较务实的角度建议还是不要这样做，尤其是服务器端程序，一个进程崩溃重启可能需要一分钟左右的时间，这段时间会造成服务的处理能力下降，也会造成一部分连接没有被正确地处理完成，这个后果很可能是更加严重的。

当我们应当将在这个事件中捕捉到的错误视作非常严重的错误，因为在此时已经丢失了和这个错误有关的全部上下文，必然无法妥善地处理这个错误，唯一能做的就是打印一条日志。

unhandledRejection 事件可以捕捉到那些被 reject 但没有被添加 `.catch` 回调的 Promise, 通常是因为你忘记为一个返回 Promise 的函数添加 return。因为 Promise 本来就是对异步错误的一种封装，所以实际使用中偶尔也会出现 Promise 先被 reject, 而后再用 `.catch` 添加错误处理的情况，所以这个事件实际上偶尔会有误报。

## 传递异常

前面我们按照 Node.js 中不同的异步流程控制方法介绍了如何捕捉和传递异常，接下来我还要介绍一些传递异常的过程中的一些最佳实践：

* 注意 Promise / callback chain 不要从中间断开
* **只处理已知的、必须在这里处理的异常，其他异常继续向外抛出**
* 不要轻易地丢弃一个异常
* 传递的过程中可以向 err 对象上添加属性，补充上下文

相信在调试过程中最让人恼火的事情就是明明有错误发生，但错误却没有正确地传递回来，通常是因为这个错误在代码中被「不小心」地处理掉了，因此我们应该在进行错误处理时去注意保障外层代码的「知情权」，仅去处理必须在此处处理的异常，应该严格地去判断异常的类型和 message，确保只处理预期的异常，而其他大部分的异常都要继续向外层抛出：

```javascript
function writeLogs(logs) {
  return fs.writeFile('out/logs', logs).catch( (err) => {
    if (err.code === 'ENOENT') {
      return fs.mkdir('out').then( () => {
        return fs.writeFile('out/logs', logs);
      });
    } else {
      throw err;
    }
  });
}
```

这里我们实现了向 `out/logs` 这个文件写入日志的函数，如果 out 这个目录不存在则会产生一个 `ENOENT` 的错误，我们非常确信这个错误应该通过创建 out 这个目录来解决，所以我们决定去捕捉 `fs.writeFile` 的错误，然后严格地去判断 `err.code`，如果不是 `ENOENT` 还要继续抛出。其实打印日志也算是处理异常的一种，如果没有必要在此处打印日志（例如你还会继续抛出这个错误），那么就不要轻易打印日志，否则就会出现我们前面提到的，程序中发生了一个错误，到处都在打印日志。

既然我们不应该轻易地处理异常，那么显然也不应该轻易地丢弃一个异常：

```javascript
copyFileContent('a', 'b').catch( err => {
  // ignored
});
```

的确有时我们需要忽略一个错误，但即使要忽略错误，也应该去判断异常的类型，确保它的确是我们想要忽略的那种错误。

前面我们提到了上下文对定位错误的重要性，有的时候我们可以捕捉异常，向上面附加一些上下文然后继续抛出：

```javascript
function mysqlQuery(sql, placeholders) {
  return mysqlClient.exec(sql, placeholders).catch( (err) => {
    err.sql = sql;
    throw err;
  });
}
```

这里的例子是一个用来进行数据库查询的工具函数，当一个数据库查询失败了，我们最感兴趣的可能是这个查询是什么，因此在这里我们捕捉了查询失败时的异常，将 SQL 语句作为属性附加到异常上，然后继续抛出。

还有的时候我们捕捉异常是为了回滚数据：

```javascript
function mysqlTransaction(transaction) {
  return mysqlPool.getConnection( (connection) => {
    return connection.beginTransaction().then( () => {
      return transaction(connection).then( (result) => {
        return connection.commit().then( () => {
          return result;
        });
      }).catch( (err) => {
        return connection.rollback().then( () => {
          throw err;
        });
      });
    });
  });
}
```

这里的例子是一个用来进行数据库事务操作的工具函数，我们先从连接池得到一个连接、开始一个事务，然后执行要在事务中进行的操作。如果操作执行完成，我们提交这个事务，如果执行失败，我们捕捉异常，然后将事务回滚，最后将异常继续向外层抛出 —— 因为作为一个工具函数我们并不知道这个事务的失败对于业务逻辑意味着什么。

## 在程序的边界处理异常

前面我们讲了那么多都在提醒大家不要轻易地处理异常，而是让异常沿着调用栈向外层传递，在传递的过程中可能有一部分异常被忽略或以重试的方式被处理了，但还有一些「无法恢复」的异常被传递到了程序的「边界」，这些异常可能是预期的（无法成功执行的任务）或者非预期的（程序错误），所谓程序的边界可能是：

* Routers（对于 Web-backend 而言）
* UI Layer（对于 Web/Desktop App 而言）
* Command Dispatcher（对于 CLI Tools 而言）

我们需要在程序的边界来处理这些错误，例如：

* 展示错误摘要
* 发送响应、断开 HTTP 连接（Web-backend）
* 退出程序（CLI Tools）
* 记录日志

**正因为这些错误最后被汇总到了一处，我们可以以一种统一的、健壮的方式去处理这些错误**，例如在一个 Express 程序中，我们会有这样的代码：

```javascript
app.get('/', (req, res, next) => {
  copyFileContent(req.query.from, req.query.to).then( () => {
    res.send();
  }).catch(next);
});

app.use((err, req, res, next) => {
  err.userId = req.user.id;
  err.url = req.originalUrl;
  logger.error(err);
  res.status(err.statusCode || 500).send(err.message);
});
```

Express 是没有对 Promise 提供支持的，因此 Express 的中间件可以算是 Promise 代码的边界，我们需要手动地将异常传递给 Express 的 next, 以便进入到 Express 的错误处理流程。

Express 提供了一种错误处理中间件，在这里我们依然保留着有关 HTTP 连接的上下文，一个比较好的实践是在这里将 HTTP 连接所关联的用户、请求的 URL 等信息作为上下文附加到错误对象上，然后将错误记录到日志系统中，最后向客户端发送一个错误摘要。

这里只是一个简单的例子，在实际项目中这个错误处理中间件可能会很长很复杂，有很多内部的约定（例如 `err.statusCode`）来决定如何处理这个错误，正是因为错误被汇总到了这里，我们才有能力进行统一的处理。

最后，我向大家推荐一个叫 [Sentry](https://getsentry.com) 的开源软件，它提供了各个语言的 SDK, 仅需简单的配置就可以将错误发送到 Sentry 提供的一个 Web 服务上面（实际上我们的项目中就会在 Express 的错误处理中间件向 Sentry 发送错误）。Sentry 提供了一个 Web 的 Dashboard, 会将同类错误聚合在一起，显示每个错误在过去一段时间发生的次数、影响的用户数量。你还可以在向 Sentry 发送错误时提供额外的 Tag, Sentry 可以根据 Tag 进行统计和分析。Sentry 还可以通过添加规则的方式配置 Webhook 和邮件报警。

## 小结

我们来对今天的技术分享做一个简单的小结：

* 在层次化的架构中，很多时候在当前的层级没有足够的信息去决定如何处理错误，因此我们需要使用异常来将错误沿着调用栈逆向抛出，直到某个层级有足够的信息来处理这个错误。
* 在异步的场景下我们应该使用 Promise 或相兼容的流程控制工具来模拟异常机制。
* 传递异常时可以回滚数据或向其补充上下文，但如非必要，需要继续向外抛出。
* 让所有无法被恢复的错误传递到程序的「边界」处，统一处理。
