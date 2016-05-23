---
title: 简历
permalink: resume/
reviews:
  -
    author: nodejh
    body: 然而并不觉得厉害，包装而已。
  -
    author: shane
    body: 个人觉得精通两门语言已经足够了。
---

王子亭，1995 年生于辽宁沈阳，现居江苏苏州，目前在 [LeanCloud](https://leancloud.cn/) 任 Node.js 服务器端开发工程师。

* Github: [jysperm](https://github.com/jysperm)
* 博客: [jysperm.me](https://jysperm.me/)

联系方式：[jysperm@gmail.com](mailto:jysperm@gmail.com)

## 近期项目

### LeanEngine

2015 年 11 月至今，LeanEngine 是一个使用 Node.js 和 Docker 构建的后端应用托管平台（PaaS），为其上的应用提供在线编辑代码、依赖构建、平滑部署、版本回滚、负载均衡等功能。我在过去半年中负责云引擎日常的维护工作、部分地参与了一些核心功能的开发。

### 贝米钱包

2014 年 11 月至 2015 年 9 月，贝米钱包是一个 P2P 的互联网金融项目，其网站负责接受用户充值、开展运营活动、追踪用户的每一笔投资并计算收益、为用户展示统计信息。在近一年中，我参与了服务器端大部分的设计工作，负责了大约一半的编码工作，包括：

* 基于 Redis 设计了层次化的缓存架构，以便通过事件来刷新统计信息中的部分数据，以减轻复杂的统计信息对数据库的压力。
* 借助 InnoDB 的事务和基于 Promise 的错误处理，使得即使业务逻辑中任何一个环节出现异常，也可以正确地回滚数据。
* 为项目添加单元测试和 API 测试，覆盖到了所有主要的功能点，为之后的重构和新功能的开发提供了保障。

### RootPanel

2012 年 3 月至 2016 年 3 月，我在业余时间断断续续地一个人开发这个项目，[RootPanel](https://github.com/HackPlan/RootPanel) 是一个开源的插件化 PaaS 开发框架，它提供了用户系统、付费计划管理等功能，以便在此基础上以插件的形式开发服务（如虚拟主机、代理等）：

* 提供了一个 Web UI 去配置 Nginx 反向代理来共用 80 端口、配置 MySQL 和 MongoDB 数据库、配置 Supervisor 和 Shadowsocks 等服务；通过 coreutils, procps, iptables 等工具和系统交互来进行 CPU、内存和流量的统计。
* 实现了一个设计良好的插件化架构，通过 Registry 和 Hook 的模式允许插件去修改主程序的行为、添加新的功能，上述的功能都是以插件的形式实现的。

### 番茄土豆

2013 年 8 月至 2015 年 9 月，番茄土豆是一个番茄工作法和 Todolist 的实现，支持多平台间的数据同步。我在这两年中部分地参与了这个项目，包括使用 Node.js 配合 Express, Mongoose, Redis, Node-Resque 重构原 PHP 版的番茄土豆等工作。

## 技术栈

### Node.js

自 2013 年末开始使用 Node.js, 参与了数十个线上项目，包括自动交易（比特币）、交易所（比特币）、账户系统、订单系统、运维和监控系统、Web 图表后端、多语言模板渲染、邮件队列、命令行工具、实时消息推送、插件化架构等场景。

配合 Node.js 使用过 MySQL、MongoDB、Redis 等数据后端；对 JavaScript 有较为深入的了解，同时也在使用 CoffeeScript 和 ES6/Babel.

在 Node.js 方面的开源项目：

* [Mabolo](https://github.com/jysperm/Mabolo)：一个 MongoDB ORM, 对嵌入和引用关系（较 mongoose）有更好的支持。
* [Cichorium](https://github.com/jysperm/Cichorium)：基于中间件的 Promise 风格的路由框架。
* [pomo-mailer](https://github.com/jysperm/pomo-mailer)：多语言邮件渲染和邮件队列。
* [RootPanel](https://github.com/jysperm/RootPanel)：一个插件化的 PaaS 开发框架。
* [mysql-querier](https://github.com/jysperm/mysql-querier)：用 JSON 格式的查询语法生成 SQL.

### PHP

早期热衷于设计 Web 框架和 ORM，有较为扎实的 PHP 基础，后因开发 Node.js 离开 PHP 社区一段时间，最近重回 PHP 社区使用 Laravel 做 Web 开发，对 PHP7、自动测试、异常收集、指标采集均有一些实践。

### Web

对 HTML、CSS 和浏览器端 JavaScript 有基本的了解，有一些 Bootstrap 和 React 开发经验，对 Less 和 Jade 等替代语言也有些使用经验，对前端工程化亦有很多实践。

在 Web 前端方面的开源项目：

* [hexo-theme-simpleblock](https://github.com/jysperm/hexo-theme-simpleblock)：为 [个人博客](https://jysperm.me/) 设计的简洁风格博客主题。

## 技术之外

* 高中退学。
* 熟练使用 Git 并用 [GitHub](https://github.com/jysperm) 分享代码。
* 自有收入开始没有使用过盗版软件和游戏。
* 活跃于 [V2EX](https://www.v2ex.com/member/jybox)、[SegmentFault](http://segmentfault.com/u/jysperm)、[知乎](http://www.zhihu.com/people/jysperm) 等社区。
* 自 2002 年创建了一个[博客](https://jysperm.me/)，目前有高质量原创文章百余篇。
