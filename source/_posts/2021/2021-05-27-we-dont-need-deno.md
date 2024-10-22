---
title: 我们并不需要 Deno
alias: we-dont-need-deno
tags:
  - Node.js
date: 2021-05-27
---
[Deno](https://deno.land/) 一出生便带着光环 —— 它发布于 Node.js 创始人 Ryan Dahl 的演讲「[Design Mistakes in Node](https://www.youtube.com/watch?v=M3BM9TB-8yA)（[幻灯片](https://tinyclouds.org/jsconf2018.pdf)）」，当时有些人说 Node.js 要凉了，但我不这么认为。

## 原生 TypeScript
其实目前我们在引擎的「用户态」去使用 TypeScript 并没有引入任何问题，而且给用户带来了很大的灵活性。考虑到 TypeScript 不可能离开 JavaScript 的生态 —— 毕竟引擎总是要支持 JavaScript 的；再加上 TypeScript 有不同的版本、不同的编译开关，在用户态使用 TypeScript 可以说是最好的方案了。TypeScirpt 迟早会成为 Deno 的历史包袱。

从性能的角度，在 TypeScript 没出现之前，V8 已经在 JavaScript 上进行大量 [魔法优化](https://zhuanlan.zhihu.com/p/29638866) 了，可以说 JIT 出来的代码并不比其他静态类型的语言差太多，是没法简单地通过 TypeScript 来提升性能的。再加上前面说了引擎总还是要支持 JavaScript、TypeScript 的运行时语义依然是 JavaScript（TypeScript 并不能保证对象的实际类型在运行时不被修改），所以引擎也不可能从对 JavaScript 的魔法优化切换到基于 TypeScript 的类型来做优化。

## 包管理器
我一直认为 NPM 是最好用的包管理器之一，这包括将依赖保存在项目目录中 —— 在调整一个项目的依赖时不必担心对其他项目产生影响；每个包都可以指定自己的依赖版本，允许多版本并存 —— 在升级一个包的依赖时不会影响到其他包，每个包都可以使用新的版本或继续使用旧的版本；NPM 负责查找和安装包，而 Node.js 则用相对简单的协议去使用这些包，它们可以彼此独立地升级演进。

可以看到 NPM 最终极大地减轻了开发者的心智负担，只要你按照正确的方式去使用它，极少会遇到其他语言中有关依赖管理的问题。而 Deno 则反其道行之。虽然 Deno 也提供了一些相关的功能（[deno cache](https://deno.land/manual@master/linking_to_external_code/reloading_modules)），但你会发现 Deno 的本意仍然是不希望进行「依赖管理」。

在代码中包含 URL 是一个非常糟糕的做法（Golang 也是如此），Deno 称之为去中心化，但其实它只是重新将使用包的代码与包的来源耦合在了一起（现在 Deno 提供了一个 [官方的代理](https://deno.land/x)，但这样和 NPM 的中心仓库又有什么区别呢）。缓存机制也带来了相当大的不确定性：`package-lock.json` 可以保证每次安装的依赖是完全一致的，而 Deno 的 [lock.json](https://deno.land/manual@v1.10.2/linking_to_external_code/integrity_checking) 只能检查依赖是否有变化（如果有的话就拒绝运行）。这使得开发者很难控制依赖更新的时机，[Deno 则建议将依赖缓存放入 Git](https://deno.land/manual/linking_to_external_code#but-what-if-the-host-of-the-url-goes-down-the-source-won#39t-be-available)。

## 内建权限系统

一直以来通用编程语言都不曾在语言层面引入权限控制，但确实开源社区也曾报出过多次恶意代码的事件，但 Deno 的权限机制相当粗糙 —— 只能在进程级别进行权限控制，我可以大胆地预言，在几乎所有的场景里我们都需要 `--allow-all`，并不能对安全起到太多作用。

我们需要考虑 Deno 的用户到底是开发者还是使用者：对于 Deno 脚本的使用者来说关注的当然是进程级别的权限；而对于开发者我认为更关注的是第三方包的权限，权限系统应该以包为单位（然而 Deno 里并没有包的概念了），Node 里本来也有 vm 模块可以一定程度上实现沙盒（但确实非常难以控制）。

而且说起来我们现在已经有了 Docker（或者更广泛的容器的概念）这种彻底的隔离和权限控制机制，业界对编程语言引入一套权限控制已经没有太大的需求了。

## 孤立的生态
可以说 JavaScript 的生态来自于用户态类库的充分竞争，Deno 则在 runtimes API 之外提供了 Standard Library（类似 `golang.org/x`）、提供了全套的开发工具链（fmt、test、doc、lint、bundle），在试图提供开箱即用的使用体验的同时，也削弱了第三方生态。

在 Node.js 和 NPM 已然成为 JavaScript 事实标准的一部分的情况下，Deno 本来可以通过兼容 Node.js 或 NPM 有一个非常好的开场。但 Deno 却选择了和 Node.js 划清界限，而是兼容了一些浏览器环境的 API（如 prompt 或 onload）。

Deno 自己的说法是为了遵循已有的 Web 标准避免发明新东西，但实际上这些 Web 标准在设计时并未充分考虑浏览器之外的 runtimes，况且 Deno 其实也没能避免发明新东西（这些新东西被放在了 Deno 这个命名空间中）。

## 小结
Deno 就是这样一个有着非常鲜明个人偏好的 JavaScript runtimes，它试图去纠正 Node.js 的一些「设计失误」、希望给出一种「JavaScript 最佳实践」，希望提供高质量且开箱即用的标准库和工具链。这些偏好的选择总会有人喜欢或不喜欢，但除此之外 Deno 实在是缺少一个 killer feature（杀手级特性）让一个「理性」的 Node.js 开发者（如一个公司）切换到 Deno。

通过单一文件发行、进程级别的权限控制使 Deno 会更适合命令行工具的开发，但能否与已经广泛用于命令行工具的 Golang 竞争尚且存疑。

作为一个 Node.js 开发者，我并不觉得 Deno 可以在未来替代 Node 成为我的主力开发工具，Deno 更像是 Golang 的设计哲学对 JavaScript 的一次入侵.
