---
title: '与精子同款的博客主题 Simple Block 现已发布！'
permalink: hexo-theme-simpleblock
tags:
  - Node.js
  - Hexo
date: 2015-07-04
---

今年年初，因为我已经很久不写 PHP 了，所以我将 [我的博客](https://jysperm.me) 从 WordPress 换到了基于 Node.js 的 Hexo, 顺便自己编写了一个专用于我的博客的主题。

一周前我用 Github 开源的 [Primer](http://primercss.io/) 重写了这个博客主题，将与我相关的个人信息修改为可配置项，然后将这个主题正式发布为了 [Simple Block](https://github.com/jysperm/hexo-theme-simpleblock), 它实现了：

* 支持使用 Jade 和 Markdown 向边栏添加小部件，或向正文前添加横幅。
* 响应式设计，支持移动设备直接浏览，首次加载（gzip）仅 15k.
* 为 Mac, Windows 以及 Linux 挑选了恰当的字体。
* 正文使用 Github 开源的 Markdown 样式。

这个主题掺入了非常多我的个人偏好，比如我使用了 Jade 和 CoffeeScript, 使用了 Gulp, 以及页面中一些奇怪部分（链接到源文件什么的）。

在设计上，我参考了我原来使用的 WordPress 2012 默认主题 [Twenty Twelve](https://wordpress.org/themes/twentytwelve/), 我将各个部分放到了单独的白色区块上，并使间隙透明，于是就有了 Simple Block.

我平时很少设计前端页面，自知设计水平很差，这款主题基本上代表了我近期前端设计的最高水平了。

## 实现细节

Hexo 支持用 Node.js 编写插件或者主题的 helper, 这是非常大的一个亮点。

我看了官网上列出的几个主题，它们都没有 npm 依赖，在说明中建议直接将 Git 仓库克隆下来，就算安装完成了。

而我的主题依赖了 coffee-script, jade 以及 marked, 所以需要一个安装依赖的过程，Hexo 并不会自动为主题安装依赖，所以需要用户自行运行 `npm install`.

另一方面我发现官网上的主题都直接将前端依赖放到了 Git 仓库中，我觉得这样是不恰当的，于是我使用 bower 和 gulp 来构建前端样式，然后将编译好的版本上传到 Github 的 Release 中，让用户下载编译好的版本，而不是直接克隆 Git 仓库。其实 Hexo 提供了对 CSS 方言的自动编译，但功能较弱，没有办法完全替代 gulp 等构建工具的功能。

以上是我在开发这个主题的过程中发现的 Hexo 主题机制的一些问题，我还没探索出合适的解决方案，各位在安装的过程中如果遇到问题，请向我提出。
