---
title: 抽象的构件
alias: unit-of-abstract
date: 2015-03-09
reviews:
  -
    author:
    body: 「函数作为第一类值」First-class function 吧：<http://en.wikipedia.org/wiki/First-class_function>，翻译成第一类也真是够直接的了，直接把 class 翻译成了类。明显这里的 class 应该是等级的意思。
---

最近在看「[JavaScript 权威指南](http://www.amazon.cn/gp/product/B007VISQ1Y/ref=as_li_ss_tl?ie=UTF8&camp=536&creative=3132&creativeASIN=B007VISQ1Y&linkCode=as2&tag=jysperm07-23)」和「[计算机程序的构造和解释](http://www.amazon.cn/gp/product/B0011AP7RY/ref=as_li_tf_tl?ie=UTF8&camp=536&creative=3200&creativeASIN=B0011AP7RY&linkCode=as2&tag=jysperm07-23)」，于是不由得对比起 JavaScript 和 Lisp. 之前看「[黑客与画家](http://www.amazon.cn/gp/product/B00G1ZT2C0/ref=as_li_tf_tl?ie=UTF8&camp=536&creative=3200&creativeASIN=B00G1ZT2C0&linkCode=as2&tag=jysperm07-23)」的时候，作者在极力地推销 Lisp, 认为因为它优良的设计，所以是世界上最好的编程语言。但是从结果来看，Lisp 依然是一个极其小众的语言（以至于 MIT 已经将 6.001 从 Lisp 换到了 Python）。

在我读 SICP 的过程中，我开始感叹这本书选择 Lisp 作为表现语言是十分明智的，如果换一个语言恐怕这本书就不会有这么大的影响力了。编程中最核心、最有挑战性的工作是「抽象」，通过抽象来控制复杂度，让构建数十万、数百万行的程序成为可能，而编程语言则负责提供抽象的手段。

按我的理解，Lisp 提供了三项非常基本，但十分强大的抽象手段：

* 函数作为第一类值，可以作为参数传递，可以将动作抽象成数据
* 变量在离开了作用域后依然可以被闭包使用，函数可以拥有内部状态
* 序对作为最基本的数据结构，可以在两项数据之间建立联系

于是 SICP 才可以由这些基本手段开始，逐步介绍如何一层一层地构造更复杂的抽象。如果换成 Python 的话，一方面存在一些限制（无法像操纵数据一样操纵代码），另一方面各种复杂的抽象手段（类）和数据结构（数组和散列表）又让人眼花缭乱，抓不住「抽象」的基本单位。

但正因为 Python 在提供复杂抽象手段的同时，又提出了一些限制，才能被广泛地使用。因为很多人是没有系统地学习过「抽象」这项技能的，对于他们而言，编程语言必须直接提供强有力的抽象手段，而不能只提供基本的抽象构件。

由此我又想到了 JavaScript 一开始只用在浏览器里实现简单的动作，最近几年才开始被用来构建大型的单页应用和服务器端程序。于是开始有很多人抱怨用 JavaScript 实现面向对象很麻烦，甚至说 JavaScript 是一个设计得很不好的语言。实际上 JavaScript 的原型是要比传统的面向对象接口（类、继承、静态成员/实例成员、共有成员/私有成员、多态）更基本的构件，但有些人并不这么觉得，他们觉得 JavaScript 必须直接提供更高抽象程度的面向对象接口（其实 ES6 已经在这么做了）。
