---
title: semver：语义化版本规范在 Node.js 中的实现
tags:
  - Node.js
alias: node-package-semver
date: 2016-04-23
---

精子又开了一个新系列！我计划在这个系列中每篇文章介绍一个 NPM（Node Package Manager）上的包，来向大家分享一些我在使用这个包的过程中的经验，同时也会延伸到一些相关的技术，例如如果介绍 redis 这个包，那么我也会顺便介绍一下 Redis. 因为对于一些使用广泛的包我可能需要更多的时间来搜集资料，所以一开始会从一些比较小而专的包开始。

# semver

 我们先从 [semver](https://www.npmjs.com/package/semver) 这个不起眼的包开始，它是 [语义化版本（Semantic Versioning）规范](http://semver.org/lang/zh-CN/) 的一个实现，目前是由 npm 的团队维护的，实现了版本和版本范围的解析、计算、比较，在 NPM 的被依赖（[Most depended-upon](https://www.npmjs.com/browse/depended)）榜单中排名 34.

 Semantic Versioning 是由 GitHub 的联合创始人 Tom Preston-Werner 建立的一个有关如何命名软件和库（包）版本的规范，用以解决在大型项目中对依赖的版本失去控制的问题（例如你可能因为害怕不兼容而不敢去更新依赖）。现在 Semantic Versioning 已经在开源社区中得到了广泛的认同，Node.js 的包管理工具 npm 也完全基于 Semantic Versioning 来管理依赖的版本。

semver 定义了两种概念：

* 版本是指例如 `0.4.1`、`1.2.7`、`1.2.4-beta.0` 这样表示包的特定版本的字符串。
* 范围则是对满足特定规则的版本的一种表示，例如 `1.2.3-2.3.4`、`1.x`、`^0.2`、`>1.4`.

在这两种概念上可以进行很多种计算，例如比较两个版本的大小、判断一个版本是否满足一个范围、判断一个版本是否比范围中的任何版本都大等。

显然这个包的使用场景就是与版本号打交道。例如你有一个客户端工具，需要在每次启动时向服务器发起一个查询来检查更新，那么用 semver 去比较版本将会是一个很好的选择：

    console.log(semver.gt(lastestVersion, currentVersion) ? 'New Update available' : 'Already lastest version');

基于 Semantic Versioning 规范，我们还可以计算出两个版本之间的差异程度：

    console.log(semver.diff(lastestVersion, currentVersion) == 'major' ? 'Major Release' : 'Minor or patch Release');

再比如你在实现一个插件化的系统，每个插件（在 [package.json](https://docs.npmjs.com/files/package.json#engines) 中）都会声明一个所兼容的主程序的版本范围，而主程序在加载插件时需要检查这个版本并使当地给出警告：

    plugins.forEach(function(plugin) {
      if (!semver.satisfies(platformVersion, plugin.engines.platform))
        console.log(plugin.name, 'require', plugin.engines.platform, 'but unable to meet');
    });

在你使用 [express](https://www.npmjs.com/package/express) 设计一个支持多种版本的 API 服务器时，你可以这样做：

    app.get('/', apiVersion('<0.6'), function(req, res) {
      res.send('Less than 0.6');
    });

    app.get('/', apiVersion('1.2.3 - 2.3.4'), function(req, res) {
      // ...
    });

    app.get('/', apiVersion('*'), function(req, res) {
      res.send('Unsupported version');
    });

其中 apiVersion 中间件的一个简单实现：

    function apiVersion(range) {
      return function(req, res, next) {
        if (semver.satisfies(req.headers['accept-version'], range))
          next();
        else
          next 'route'; // skip this route
      };
    }

也许你用字符串计算再配合一点正则也可以完成上述的场景，但你很难做到对 Semantic Versioning 的完备支持，在之后发布新版本后撰写版本号的时候也会受到限制，例如 semver 可以正确地比较 `0.9.0` 和 `0.10.0` 以及 `0.9.0-beta.1`，但自行实现这些支持将会非常繁琐。

所以其实选择 semver 的理由很简单 —— 让专业的包去完成专业的工作，相信这也是在 Node.js 社区得到了广泛认同的观点。
