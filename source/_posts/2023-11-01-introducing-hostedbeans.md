---
title: 'HostedBeans: 基于 Beancount 的协作托管服务'
alias: introducing-hostedbeans
date: 2023-11-01
---

我从 2019 年开始使用 [Beancount](https://github.com/beancount/beancount) 记账，作为一个开发者，我非常喜欢这样的纯文本工具 —— 纯文本意味着我可以使用我最熟悉的编辑器来编辑它、可以使用脚本进行批处理，还可以使用 Git 来进行版本控制，最大程度地利用我熟悉的工具。

在和蛋黄在一起之后，我们的资金和帐目不可避免地混在了一起，如果不把她产生的帐目一起记录进来，那么记账这个事情就显得没有什么意义了。但 Beancount 对于非开发者来说使用门槛还是太高了，需要在本地配置 Python、Git 等环境，前面提到的那样纯文本的优势对她来说其实是一种负担。所以她之前一直很难参与进来，即使只是查看 Fava 的图表，也需要我先在我的电脑上启动 Fava，然后把地址发给她。

为了让蛋黄至少能够随时查看图表，我调研了几个现有的 Beancount 托管服务，但我觉得它们都缺少了一些关键的能力：

- Git 访问：纯文本是 Beancount 最大的特点，即使使用托管服务也不应该影响使用 Git 和本地编辑的工作流。
- 多人协作：可以让多人共同访问一个账本，在 Web UI 对账本的修改也应该反应到 Git 中。

于是我开发了 HostedBeans 这个项目 —— 基于 Beancount 的协作托管服务，同时支持 Git 和 Fava 访问，可以为账本添加协作者并管理他们的权限，在 Web UI 上的改动也会以协作者的名字被自动同步进 Git。

使用 HostedBeans 你可以保持之前的工作流不变，在本地使用你熟悉的编辑器、使用 Git 进行版本控制，但同时解锁了随时随地打开 Fava 的能力，而且可以和你的家人共享这种能力，让他们参与到你的记账中来。

目前 HostedBeans 的功能已经全部可用，我还在继续进行一些细节调整来改善体验。如前面所说，HostedBeans 的目标是 Beancount 和 Fava 的托管服务，我今后我专注在「托管」这个方向上，不会添加「私有」的功能来锁定用户，确保用户可以随时迁移出来。比如 HostedBeans 不会自己实现任何实际的「功能」，而是会接入 Beancount 和 Fava 社区既有的插件，如有必要会直接在上游的开源项目中来开发功能。

欢迎访问 [www.hostedbeans.io](https://www.hostedbeans.io) 注册帐号试用，我们的免费版本可以让你创建一个私有的账本并和其他一名协作者一起记账。如有疑问或者建议欢迎通过邮件、Telegram 或者 Twitter 联系我，联系我还可以免费获赠 Pro 帐号。

> 本文原载于 [HostedBeans 的文档页面](https://www.hostedbeans.io/docs/introducing)
