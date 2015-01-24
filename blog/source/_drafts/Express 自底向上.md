## 写在前
前一阵看了「[Redis 设计与实现](http://www.amazon.cn/gp/product/B00L4XHH0S/ref=as_li_ss_tl?ie=UTF8&camp=536&creative=3132&creativeASIN=B00L4XHH0S&linkCode=as2&tag=jysperm07-23)」这本书，觉得很对我的胃口，即从底层实现来介绍一个东西，而不是像其他大多数教程一样，先从简单的例子来入手。

因此这篇文章适合已有 Node.js 开发经验，使用过 express 但没有深入了解过，或者使用过其他 Node.js Web 框架，希望迁移到 express 的读者。这篇文章将从 express 的原理开始，自底向上地介绍 express 的设计和实现。

## Express
Express 是一个迷你的 Node.js Web 框架，它提供了若干与 HTTP 相关的辅助功能，和一个基于中间件的路由分发系统，它并没有封装来自 Node.js 本身的功能。

参考资料：

* Express 的官网在 <http://expressjs.com>
* Express 的源代码在 <https://github.com/strongloop/express>, 代码库中包含了很多示例（examples 文件夹）
* Express 的很多工作基于 <https://github.com/jshttp>
* 一些与 Express 相关实用拓展位于 <https://github.com/expressjs>

Express 的主要结构：

* Application

Application 表示一个应用，通过 `express()` 来创建，通常在代码中写作 `app`, 通过 app 可以对整个应用进行配置，例如设置模板引擎（如 `app.set('view engine', 'jade');`）。还可以通过 app 在整个应用级别来定义路由规则（如 `app.use` 和 `app.post`），app 与路由相关的功能实际上是由一个 `Router` 实现的。

* Response

Response 表示一个对请求的响应，通常将其的实例写作 `res`, 当有请求产生的时候，由 express 内部调用中间件时，作为参数传递给中间件。res 提供了一些方法来构造请求，其中有一些方法是在准备请求，如 `res.header`, `res.status`, `res.cookie`; 还有一些方法会结束对应的请求，并将响应发往客户端，如 `res.send`, `res.redirect`.

* Request

Request 表示一个请求，与 res 通常成对出现，通常将其的实例写作 `req`. req 主要提供了一些从请求中获取数据的方法，如 `res.header`. 通常一些与解析请求有关的中间件会将解析后的数据存储在 res 上，如 `res.cookies`, `res.body`.

* Router

Router 表示一个具有路由功能的实体，可以由 `express.Router()` 创建。可以通过 `router.use` 和 `router.METHOD` 来定义路由规则，并可以通过 `router.param` 来定义对 URL 参数进行处理的规则。在内部，Router 管理着一个包含 Layer 和 Route 的列表。

* Layer

Layer 是 Express 中的一种内部结构，用于将中间件和执行中间件的条件（如路径和 HTTP 动词）捆绑在一起。

* Route

Route 是 Express 中的一种内部结构，用于表示一组位于特定路由上的 Layer(中间件).

* View

View 是 Express 中的一种内部结构，表示一个模板引擎，可以使用 `app.engine` 向 Express 注册指定后缀的引擎，然后可以使用 `res.render` 来渲染模板。
