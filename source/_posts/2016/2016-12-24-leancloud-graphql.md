---
title: 在 LeanCloud 中使用 GraphQL
alias: leancloud-graphql
tags:
  - LeanCloud
  - Web
date: 2016-12-24
---

[GraphQL](http://graphql.org/) 是 FaceBook 开源的一套数据查询语言，也是 [Relay](https://facebook.github.io/relay/) 钦定的组件，可以在客户端以一种非常灵活的语法来获取数据，但目前支持 GraphQL 的服务还比较少，最近 [GitHub 也宣布了其开放 API 支持了 GraphQL](http://githubengineering.com/the-github-graphql-api/)。

因为 GraphQL 的支持需要服务器端的更改，因此我选择了在 LeanCloud 的数据服务的基础上用 Node.js 编写一个中间层，运行在云引擎上，将 GraphQL 的查询翻译成对 LeanCloud SDK 的调用，为客户端提供 GraphQL 支持。

我也参考了其他语言和框架的 GraphQL 支持，它们都需要开发者进行很多的开发或配置工作。这是因为无论在 MySQL 还是 MongoDB 中都并没有记录数据之间的关联关系（Id 和 ObjectId 都不会记录指向的表或集合，MySQL 的外键倒是会记录，但可惜用户不多）；而且即使你定义了数据之间的关联，你还是需要去定义权限 —— 哪些用户可以访问哪些数据。

而 LeanCloud 的 Relation 和 Pointer 都记录了所指向的 Class，同时 LeanCloud 本身也有一套基于 sessionToken 和 ACL 的权限控制机制，因此我们完全可以做到从 LeanCloud 的数据服务获取数据之间的管理，然后遵循现有的 ACL 来自动实现对 GraphQL 的支持。

[leancloud-graphql](https://github.com/leancloud/leancloud-graphql) 就是这样的一个项目，你只需将它部署到云引擎上，不需要改动一行代码，便可以用 GraphQL 查询你在 LeanCloud 上的所有数据。

相较于 RESTful 和 SQL，GraphQL 为数据定义了严格的类型，你可以使用这样一个灵活的语言将数据通过关系组合起来，所见即所得地得到你想要的数据。得益于 GraphQL 的类型系统，你还可以在调试工具（[graphql.leanapp.cn](https://graphql.leanapp.cn/)）中得到精确的错误提示和补全建议。

例如这里我们查询 Todo 这个 Class 中按优先级排序的前两条数据，获取 title、priority，并将 owner 这个 Pointer 展开：

```graphql
query {
  Todo(ascending: priority, limit: 2) {
    title, priority, owner {
      username
    }
  }
}
```

结果：

```javascript
{
  Todo: [{
    title: "紧急 Bug 修复",
    priority: 0,
    owner: {
      username: "someone"
    }
  }, {
    title: "打电话给 Peter",
    priority: 5,
    owner: {
      username: "someone"
    }
  }]
}
```

目前 leancloud-graphql 已经实现了 LeanCloud 中大部分的查询参数和查询条件，你可以任意地组合这些条件。例如我们可以查询优先级大于 5 且存在 content 属性的数据：

```graphql
query {
  Todo(exists: {content: true}, greaterThan: {priority: 5}) {
    title, content, priority
  }
}
```

GraphQL 最大的亮点还是对关系查询的支持，无论是 Relation 还是 Pointer 你都可以任意地展开，而不必受到 LeanCloud RESTful API 只能展开一层的限制。例如我们查询所有的 TodoFolder 中的 Todo（Relation）并展开 owner（Pointer）：

```graphql
query {
  TodoFolder {
    name,
    containedTodos {
      title, owner {
        username, email
      }
    }
  }
}
```

结果（省略了一部分）：

```javascript
{
  TodoFolder: [{
    name: "工作",
    containedTodos: [{
      title: "紧急 Bug 修复",
      owner: {
        username: "someone",
        email: "test@example.com"
      }
    }, // ...
    ]
  }, // ...
  ]
}
```

你也可以在关系查询上附加查询参数或条件。例如我们查询所有 TodoFolder 中优先级最高的一个 Todo：

```graphql
query {
  TodoFolder {
    name, containedTodos(limit: 1, ascending: priority) {
      title, priority
    }
  }
}
```

结果：

```javascript
{
  TodoFolder: [{
    name: "工作",
    containedTodos: [
      {title: "紧急 Bug 修复", priority: 0}
    ]
  },
    name: "购物清单",
    containedTodos: [
      {title: "买酸奶", priority: 10}
    ]
  }, {
    name: "someone",
    containedTodos: [
      {title: "紧急 Bug 修复", priority: 0}
    ]
  }]
}
```

在实现一对多关系时，我们经常会在「多」上面保存一个到「一」的指针，例如一个 Todo 会有一个叫 owner 的 Pointer 指向用户表。在这时，leancloud-graphql 会自动在用户表上添加一个叫 ownerOfTodo 的属性用来表示这个反向关系，你可以像展开一个 Relation 一样展开这个反向关系，例如我们查询每个用户的 Todo 并展开 title：

```graphql
query {
  _User {
    username, ownerOfTodo {
      title
    }
  }
}
```

结果：

```javascript
{
  _User: [{
    username: "someone",
    ownerOfTodo: [
      {title: "紧急 Bug 修复"},
      {title: "打电话给 Peter"},
      {title: "还信用卡账单"},
      {title: "买酸奶"}
    ]
  }]
}
```

对 [leancloud-graphql](https://github.com/leancloud/leancloud-graphql) 的简单介绍就到这里，更多使用方法和功能介绍可以在项目的 GitHub 主页上看到，这个项目本身也是开源的。
