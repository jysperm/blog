---
title: 从被误解到最流行：论 JavaScript 如何完成华丽转身
permalink: interesting-javascript
tags:
  - Node.js
date: 2016-06-12
---

有人说「[JavaScript 是花了 10 天时间匆忙被设计出来的语言](http://www.ruanyifeng.com/blog/2011/06/birth_of_javascript.html)」，也有人说「[凡是能用 JavaScript 写出来的，最终都会用 JavaScript 写出来](https://blog.codinghorror.com/the-principle-of-least-power)」。写这篇文并非要对 JavaScript 做一个全面的优劣分析，而是想与大家分享一些存在于 JavaScript 及其生态系统中的、在我看来比较有趣的闪光点。  

### 插件化的语言特征

JavaScript 曾经是一门兼容性最糟糕、升级最困难的语言。开发者们要苦等到所有用户都升级了浏览器，才敢使用新版本的特征。然而在最近几年，随着 [Babel](https://babeljs.io/) 等编译器的兴起，越来越多的 JavaScript 开发者们都放开了手，开始在生产环境中使用那些尚未被纳入标准的语言特征了。

使用了 Babel 的项目需要在发布之前引入一个「构建」的步骤，将使用了较新的语言特征的源代码转译为兼容性更好、被所有浏览器所支持的早期版本的 JavaScript，所以开发者就不必再去关心用户的浏览器是否支持这项新特征了。

Babel 是一个开源的、插件化的编译器框架，JavaScript 的每个语言特征（包括那些还未被纳入标准的）都被实现成了一个插件，插件可以遍历和替换 [AST](https://github.com/thejameskyle/babel-handbook/blob/master/translations/en/plugin-handbook.md)，进而对编译的结果施加影响。令人兴奋的一点是 Babel 让语言的特征形成了模块化，也就是说开发者可以在构建脚本中来配置要使用的语言特征。

Babel 的出现大大加速了 JavaScript 的进化。因为一旦有人希望在 JavaScript 中加入一个新特征，他首先会去实现一个 Babel 插件，然后很快就会有开发者去使用这个插件（这个过程不过是修改一下构建脚本）。这样新特征会得到来自一线开发者的验证和反馈，并有效地得以改进，如此形成一个良性循环。对比来看，某一些语言的新特征在设计和普及阶段进展非常缓慢。因为如果一个特征无法成为标准，就不会有开发者使用，而没有开发者使用，标准的制定者又无法得到足够的反馈，进而推迟进入标准的时间。

### 总有一种适合你的方言

除了对 JavaScript 本身的增强，社区中还有着上百种编译成 JavaScript 的「[方言](https://github.com/jashkenas/coffeescript/wiki/list-of-languages-that-compile-to-js)」。创造一种 JavaScript 的方言并不难，你只要编写一个从源代码到 [ES AST](https://github.com/estree/estree) 的词法和语法分析器，后续的步骤交给 Babel 就好。社区中比较知名的几种方言有：

- [CoffeeScript](http://coffeescript.org/)：提供更简洁的语法，可以省略大部分的括号和花括号。
- [TypeScript](http://www.typescriptlang.org/)：强类型的 JavaScript，提供编译期类型检查。
- [ClojureScript](https://github.com/clojure/clojurescript)：提供 Clojure（Lisp）风格的语法。
- [PureScript](http://www.purescript.org/)：[类 Haskell 的语法和类型系统](https://www.infoq.com/news/2014/09/purescript-haskell-javascript)。
- [JSX](https://facebook.github.io/jsx/)：混写 JavaScript 与 HTML（React DOM）。

这些方言有着各自的风格，从外观来看语法完全不同，但它们最终都会编译成标准的 JavaScript，这意味着它们之间是可以互操作的，你可以在一个 TypeScript 的项目中使用 CoffeeScript 编写的库，反之亦然。你甚至可以在一个项目中混用不同的方言。

开发者很少需要担心新特征或方言带来的不稳定性，因为代码最终会被编译成标准的 JavaScript，只要编译的过程没有错误，最后都是交由 JavaScript 引擎来执行，这并没有为 JavaScript 引擎带来新的复杂度。一旦有一天你决定不再使用某个特征或方言时也不要紧，直接使用编译后的 JavaScript 就好了。

这样一来，可以说 JavaScript 不再是一门语言，而是一个 JVM（_JavaScript_ Virtual Machine）了。同时因为浏览器厂商（它们是这个世界上最大的科技巨头）之间的竞争和合作，JavaScript 有着几乎是所有虚拟机语言中最好的性能。

### 精简而灵活的语言核心

[JavaScript 的标准库](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects)仅包含了非常有限的功能，某种程度上来说这也是件好事 —— 精简的标准库给第三方库留出了充分的竞争空间，真正得到大家认可的库才会被广泛使用，而不仅仅因为它被包含在了标准库中。

JavaScript 语言本身并没有定义得非常好的「范式」，你可以使用函数式的风格，比如函数作为参数和返回值、闭包、[lodash 等函数式工具](https://github.com/stoeffel/awesome-fp-js)、[Immutable.js](https://facebook.github.io/immutable-js) 提供的不可变数据类型（ES2015 甚至还包括了[尾递归优化](https://github.com/v8/v8/commit/6131ab1edd6e78be01ac90b8f0b0f4f27f308071)）；你还可以使用面向对象的风格，比如使用原型 prototype 构造出具有静态成员和实例成员、支持继承和多态的类（ES2015 也添加了 class 这个关键字来更加方便直观地定义类）。

正是 JavaScript 的这种灵活性，赋予了类库的设计者很大的施展空间。很多知名的类库可以说是创造了一种新的编程范式：

- [Backbone](http://backbonejs.org/)：面向对象的 ORM，通过事件模型来通知对象的变化。
- [Express](http://expressjs.com/)：通过定义串联的「中间件」来处理 HTTP 请求。
- [React](https://facebook.github.io/react)：每当状态发生变化便重新渲染整个页面，减少用户界面状态管理的复杂度。

### 不止于浏览器环境

JavaScript 不仅可以在浏览器中运行，因为它精简的语言核心（甚至不包括任何 IO 相关的功能），现在已经被移植到了其他很多平台：

- [Node.js](https://nodejs.org/)：提供了访问文件系统、进行网络操作的 API，用于构建 Web 后端等服务器程序。
- [Ionic](http://ionicframework.com/) / Cordova：提供访问移动设备的 API，使用 Web 技术来构建移动应用。
- [Electron](http://electron.atom.io/)：让 JavaScript 可以同时访问 Web 和 Node.js 的 API，以便用 Web 技术来构建桌面应用。
- [React Native](https://facebook.github.io/react-native)：用 JavaScript 去操作原生 UI 组件来构建移动应用。

这些环境下有着和浏览器中完全不同的 API，但运行的都是同样的 JavaScript 代码，你的业务逻辑代码可以在这些环境间共用。JavaScript 社区中大部分已有的、不依赖具体运行环境的工具库都可以不加修改地运行在这些新环境中。

### 异步单线程是把双刃剑

无论在浏览器还是 Node.js 中，JavaScript 都采用了异步单线程的并发模型，所有的 IO 操作都采取异步执行，并通过「回调函数」来接收结果。以 Node.js 为例，引擎内部使用了一个[固定数量的线程池](http://stackoverflow.com/questions/20346097/does-node-js-use-threads-thread-pool-internally)，通过操作系统的「IO 多路复用」功能来进行 IO 操作，这样即使有大量并发的 IO 操作，也不过是多花了一点内存来维护相关的数据结构，并不会创建新的线程。这也是为什么大家都说 Node.js 适合高并发场景的原因了。同时 JavaScript 暴露给开发者的线程只有一个，只有这个线程会执行 JavaScript 代码，所以开发者不必象其他一些多线程语言那样去关心线程同步和线程安全的问题。JavaScript 开发者对于异步任务的接受程度也更高，他们会尽可能地让没有依赖关系的操作并行执行，[让无谓的等待时间最小化](https://jysperm.me/2014/09/1843)。

作为代价，JavaScript 中所有的 IO 操作都需要通过传递 [回调函数](http://www.infoq.com/cn/articles/nodejs-callback-hell) 的方式来获取结果，初学者会为此非常苦恼 —— 编写循环、处理异常时会束手束脚，异步回调的写法也非常繁琐，一不留神[回调函数的嵌套就会失去控制](http://callbackhell.com/)。为此社区创造了很多语言特性和工具来试图解决这个问题，包括 EventEmitter、async.js、Promise、co/generator、async/await 等。虽然基本可以认为 Promise 是未来的趋势，但目前还并没有普及到所有的 JavaScript 开发者，而且在这几种异步流程控制方案之间互相调用也很令人头痛。此外因为只有一个 JavaScript 线程在运行，所以如果在一个函数中有 CPU 密集的计算任务，它就会阻塞整个事件循环的处理，此时需要开发者手工让出线程，来处理事件循环中其他的事件。

好了，怕篇幅再长反而会分散大家对内容的理解和印象，就此收笔。我这儿还有些其他相关的内容，感兴趣的朋友可以继续读下去。

- [JavaScript - The World's Best Programming Language](http://www.infoq.com/cn/presentations/javascript-the-world-best-programming-language)（中文演讲）
