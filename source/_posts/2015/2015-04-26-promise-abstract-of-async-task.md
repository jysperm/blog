---
title: Promise：抽象的异步任务
alias: promise-abstract-of-async-task
tags:
  - JavaScript
date: 2015-04-26
reviews:
  -
    author: xr
    body: Promise 还有问题没解决，比如实现 while 语句就不行了，结合 ES6 里面的 yield 或者 ES7 里面的 async / await 使用就相对完美了。
  -
    author: c4605
    body: 除了 Promises/A+ ，其实可参考资料还有 ECMAScript 的定义 <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise>
---

我现在才认识到，我在学习 Node.js 上走的最大的弯路就是很晚才开始了解和使用 Promise.

## callback 风格的问题

Node.js 和其他主流语言最不同的地方就在于 Node.js 中所有的 IO 操作都是异步的，在传统的 callback 风格的代码中，异步函数和同步函数（非异步函数）是有很大的区别的，在使用时必须加以区分。

异步函数的最后一个参数是一个称作 callback 的函数，这个函数会在异步任务完成后被执行，第一个参数表示是否出现了错误，其余参数是异步任务执行的结果。而同步函数的执行结果作为返回值返回，在出错时会抛出异常。

	try
	  console.log syncTask input
	catch err
	  console.error err

	asyncTask input, (err, output) ->
	  if err
	    console.error err
	  else
	    console.log output

JavaScript 的异常机制在同步的情况下工作良好，但在异步的情况下则需要你在每一个异步函数完成后手动检查错误，因为这些异步函数并不在同一个调用栈上运行，所以不会像异常一样逐级传递。

	try
	  input2 = syncTask1 input
	  console.log syncTask2 input2
	catch err
	  console.error err

	asyncTask1 input, (err, input2) ->
	  if err
	    console.error err
	  else
	    asyncTask2 input2, (err, output) ->
	      if err
	        console.error error err
	      else
	        console.log output

这种不一致使得我们需要花费额外的精力去关注异步任务和同步任务之间的差别。一个例子是当一个函数由同步改为异步（例如一个函数本来不需要进行 IO, 但后来变得需要了）的时候需要修改所有调用处，简直令人抓狂。

## Promise 的解决方案

**而 Promise 通过建立抽象的方式，消除了同步函数和异步函数在调用方法、结果返回、异常流程处理上的差别。**

对于 Promise 风格的异步函数，我们不需要在调用时传递一个 callback, 而是像调用同步函数一样，只传递真正的参数。

	syncTask input
	asyncTask input

Promise 风格的函数的结果总是一个值 —— 因为一个函数只能有一个返回值。

我们总是通过函数返回的 Promise 对象来绑定 callback 或捕捉错误。

    syncTask(input).then (output) ->
      console.log output
    , (err) ->
      console.error err

    asyncTask(input).then (output) ->
      console.log output
    , (err) ->
      console.error err

在 Promise 风格的函数中，我们可以通过两种方式来产生一个错误：抛出异常或返回一个「rejected 的 Promise」。

	task1 = ->
	  throw new Error()

	task2 = ->
	  return Promise.reject new Error()

当出现错误时，错误会被逐级传递，我们只需在最后一步捕捉错误即可。

	task1(input).then (input2) ->
	  task2 input2
	.then (input3) ->
	  task3 input3
	.then (output) ->
	  console.log output
	, (err) ->
	  console.error err

## Promise 的实现

从实现的角度来将，Promise 风格的函数总是返回一个 Promise 的实例，Promise 的实例是对「一项任务」的抽象。

任务可以有三种状态：正在进行（pending）、成功（resolved）、错误（rejected）。任务的结果（成功时）或错误（错误时）会被保存为这个对象的内部状态，外部只能通过 then 来与这项任务的结果进行交互。

当使用 then 来绑定回调函数时，如果这项任务已经完成，则直接使用内部保存的结果来通知回调函数；若这项任务还未完成，则将回调函数放入队列中，等待任务完成再进行通知。

这种设计实际上是一种订阅/通知模型，Promise 对象负责维护订阅关系，而任务和回调函数本身是不存在联系的。

## Promise 的第三方拓展

[Promises/A+](https://promisesaplus.com/) 标准仅为 Promise 实例规定了 then 方法，在实际应用中，我们会使用一些与 Promises/A+ 兼容但拓展了更多功能的 Promise 实现，例如：

* [Q](https://github.com/kriskowal/q)
* [then](https://github.com/then/promise)
* [bluebird](https://github.com/petkaantonov/bluebird)
