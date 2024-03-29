---
title: 更换博客系统到 Hexo
alias: move-to-hexo
tags:
  - 博客
date: 2015-02-01
---

经过将近一个月的努力，我将之前四年一直都在使用 WordPress 的这个博客换成了 Hexo.

原因主要是 [最近一年](/2015/01/1976) 我已经不写 PHP 了，加上我最近一年热衷于统计关于我个人的 [结构化数据](https://github.com/jysperm/meta)，我希望通过网页的形式把这些数据展示在我的博客上，这时 WordPress 就显得很不好用了，于是我开始寻找一款基于 Node.js 的博客系统。

应该说 Ghost 也是一个选择，但是我想，既然我那么喜欢结构化的数据，为什么博客不使用一种更加结构化的数据形式呢，比如所有数据都通过 Git 来存储。于是我发现了 Hexo, 这是一个设计得非常不错的静态博客系统。Hexo 基于 Node.js, 默认即使用 Markdown 存储日志，Yaml 存储配置；支持包括 Jade 在内的多种模板引擎，对插件有很好的支持。

我希望在从 WordPress 迁移到 Hexo 的过程中，尽量不丢失数据，也尽量保证之前的链接都可以访问。这就意味着我可能要对 Hexo 作一个比较深度的定制，主要包括保持原有的链接、保持原有的日志评论（多说）。

既然如此，不如干脆自己写一个主题，虽然我自知毫无设计感，但使用自己编写的主题也是一件有趣的事情。于是，我为 Hexo 编写里一个专用于我的博客的简单主题，和日志源文件一起，都开源在 Github 上：<https://github.com/jysperm/meta/tree/master/blog>.

应该说目前还有很多工作没有完成，比如我早期的日志并非是用 Markdown 编写的，相当一部分需要手工进行排版。链接转换和评论迁移工作目前也仅完成了一半，但还是尽早发布好了。

另外，因为众所周知的原因，服务器从北京移到了香港。
