---
title: 'Cichorium: 基于 Promise 的中间件路由框架'
permalink: cichorium-routing-framework
tags:
  - Node.js
date: 2015-05-15
---

[Cichorium](https://github.com/jysperm/Cichorium) 的代码仅有 130 行，用 CoffeeScript 风格实现了一个简单的基于中间件的路由框架，其中的异步操作都是以 Promise 风格提供的。

Cichorium 有一个路由表和一个错误路由表。路由表是一个数组，其中每个元素可以是一个子路由表（数组），或一个中间件（函数）。

中间件会被按顺序地执行，中间件可以返回一个 Promise 表示这是一个异步中间件，Cichorium 会等待这个 Promise 被 resolve 再执行下一个中间件。在中间件中，可以用 nextRoute 来跳过当前路由表上的其他路由，直接进入父级的下一个路由，条件路由（例如匹配 HTTP 方法或 URL 前缀）就是这么实现的。

如果执行过程中抛出了异常（或 Promise 被 reject），就会进入错误处理，错误路由表中的路由会按照同样的规则被逐个调用，如果错误处理过程中抛出了新的异常，那么新的异常会替换掉之前的异常，错误处理中间件可以用 errorResolved 来解决这个异常，剩余的中间件就不会再执行了（但如果有多个异常则下个中间件会以之前的一个异常被继续调用）。

- - - -

一开始创建这个项目只是想造一个 express 的轮子，后来学习了 Promise 之后觉得 express 和 Promise 的配合有一些麻烦，express 不能识别中间件返回的 Promise, 而必须手动调用 `next`.

express 使用 `next('route')` 来跳过剩余的中间件，但我发现用抛出一个特殊的异常（Cichorium 的 nextRoute 就是这么实现的）效果会更好，而且因为有 Promise, 在回调函数中抛出的异常也会被正确地传递回 Cichorium.
