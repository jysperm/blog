---
title: 'Stream: 给机器人用的 Twitter'
permalink: introducing-stream
date: 2017-01-23
---

[Stream](https://stream.pub) 是我在 2016 年中旬完成的一个业余项目，它希望提供一个基于发布、订阅模型的消息服务，提供 HTTP API 并传输结构化的数据（JSON）。适用的场景就是自动化工具间的通讯（例如两个运行在 NAT 内的脚本需要交换数据）、自动化脚本需要推送数据给人阅读（人可以在 Web UI 上阅读消息）。

还更进一步希望能够提供移动平台的客户端，对于已经订阅的消息实现实时的推送，不过这个部分并没有完成。其实也是因为这个项目被搁置了很久，在最近我也发现了一些和 Stream 非常相似的服务（[getstream.io](https://getstream.io/)），所以才将这个半成品发布了出来。

目前 Stream 的 Web UI 可以发布、以时间轴查看消息、按照标签检索消息；HTTP API（文档位于 [Stream API Reference](https://stream.pub/api-reference/)）还提供了注册和登录帐号的功能，登录帐号后发出的消息会包含你的用户名作为特殊的标签。

当然，就像我其他的业余项目一样，Stream 其实更多地是在实践一些新的技术，比如基于 React 的双端渲染、React Native、RAML、Docker Swarm 等等。
