---
title: 'Mabolo: 轻量级的 MongoDB ORM'
permalink: mabolo-mongodb-orm
tags:
  - Node.js
  - MongoDB
date: 2015-06-05
---

一开始我像很多人一样使用 Mongoose 作为 ORM, 但时间长了我发现了 Mongoose 的一些不理想的地方。

Mongoose 通过定义 Setter 的方式记录了对文档的每一次修改，以便可以用 save 方法将文档无冲突地储存在数据库中。但我在实际使用中发现，我很少会使用这个功能，每当对文档进行更新的时候，几乎都是直接使用 MongoDB 的原子性操作符（`$set` 等）。Mongoose 在这个功能上下了很大功夫，也增加了很多额外的约束。例如它 [使用了一些黑科技](http://lucy.faceair.me/archives/361/) 来阻止用户修改从数据库查出的文档。而我希望从数据库中查出文档后进行一些加工，向文档上储存一些额外的数据来供渲染页面时使用（但不储存到数据库），本来我们在 JavaScript 这样的语言中是期待一个对象是可以被随意修改的，但在 Mongoose 中却不可以。

我发现我其实只需要 Mongoose 的一小部分功能，于是我自己编写了 [Mabolo](https://github.com/jysperm/Mabolo), 我对它的定位是一个轻量级、无黑科技的 ORM. 它完成于 2015 年初，目前已被使用到了我的大部分个人项目中。

Mabolo 用 300 行代码实现了一个 ORM 最核心的一些功能：为数据集合定义字段的类型、验证文档字段的合法性、定义类方法和实例方法、嵌入式的文档和数组、原子性地更新整个文档、同时兼容 Promise 和 callback 风格的 API.

Mabolo 几乎没有使用什么黑科技，每个 Model 都是一个普通的 JavaScript 构造函数，而每个文档则都是由这个构造函数生成的实例 —— 除了几个用来保存内部状态的不可枚举属性之外和普通的对象没有任何区别。

接下来我来谈一谈 Mabolo 中的几个实现细节。

## 定义 Model

在 Mongoose 中，要先创建 Mongoose 实例（即代表一个数据库连接）才能根据它来创建 Model, 但这样会造成 Model 定义依赖于这个全局的数据库连接。而在 Mabolo 中，可以先创建与实例无关的 Model, 然后再将其绑定到 Mabolo 实例上：

User.coffee:

    Mabolo = reuqire 'mabolo'
    module.exports = Mabolo.model 'User',
      name: String

app.coffee

    Mabolo = reuqire 'mabolo'
    mabolo = new Mabolo 'mongodb://localhost/test'
    User = mabolo.bind require './User'

即使 Model 还没被绑定到 Mabolo 实例上，也是可以执行查询的，这些插件会被阻塞，直到 Model 被绑定到一个数据库连接上。

实现上，`Mabolo.model` 会创建一个继承（CoffeeScript 的 extends）自 `AbstractModel` 的类，作为 Model 来使用。在绑定时，`Mabolo.bind` 会调用 Model 上的 `bindCollection` 函数，这个函数会 resolve 一个内部的 Promise, 让对数据库的操作开始执行。

## 嵌入式文档

Mabolo 中 Model 的字段定义，既可以是基本类型，也可以是另一个 Model, 还可以是基本类型或 Model 的数组。

    Token = mabolo.model 'Token',
      code: String

    User = mabolo.model 'User',
      tokens: [Token]

在保存文档到数据库时，Mabolo 会调用 `Model::transform` 构造字段定义中的嵌入式文档，这样才可以运行定义在嵌入式文档上的字段验证。而在从数据库取出文档时，也会构造字段定义中所描述的嵌入文档, 以便用户调用嵌入文档上的实例方法。

下一步会支持在嵌入文档上运行 update 和 remove 方法。主要实现方法是 `Model::transform` 会在构造出的嵌入文档上储存父文档和在父文档中的位置，以便 update 时为查询和更新中的字段名加上前缀。

再之后会支持文档中的引用关系，在从数据库中取出文档时，Mabolo 会自动取出被引用到的文档，这个过程被称为「填充」，用户也可以自己定义更复杂的填充规则。

## 原子性地更新文档

Mabolo 使用了和 Mongoose 类似的技术来原子性地更新整个文档，即在每次更新时都为文档设置一个版本号（在 Mabolo 中是一个随机的字符串），在进行原子更新时会将当前版本号作为一个查询条件来运行更新，如果没有成功（版本号被另一个操作修改了），会从数据库中查出最新的文档，重放修改然后再一次尝试提交。

    user.modify (user) ->
      Q.delay(1000).then ->
        user.age = 19
    .then ->

Mabolo 使用了一种更简单的方式实现重放修改 —— 即要求用户传入一个无副作用的修改函数，这个函数会在每次重放修改的时候被调用一次。应该说这只是一种不推荐大量使用的备选方案，更好的做法是直接使用 MongoDB 的原子操作符：

    user.update
      $set:
        age: 19
