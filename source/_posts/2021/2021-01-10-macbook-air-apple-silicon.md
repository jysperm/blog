---
title: 入手 MacBook Air (Apple Silicon)
alias: macbook-air-apple-silicon
tags:
  - 购物
date: 2021-01-10
---

最近两年几乎买齐了苹果的全线产品，越来越看好苹果，甚至买了一些苹果的股票，当然为什么选择苹果生态这个话题可以放在单独的文章里来说。

> 我在 Small talk 的第二期「[聊聊用 M1 芯片的新 Mac](https://1byte.io/small-talk-e2-apple-silicon/)」中也聊到了 Apple Silicon 的话题，欢迎大家收听，但这期播客录制时间较早，如有冲突还是以本文为准。

## 第一体验

在 11 月 17 日的发布会后我又观望了一周才下单，最后在 12 月 4 日拿到了搭载 [M1 处理器](https://www.apple.com.cn/newsroom/2020/11/apple-unleashes-m1/) 的 MacBook Air，我将内存升级到了 16G ，存储则还是低配的 256G。

![](https://r2-lc-cn.jysperm.me/pictures/2021/macbook-order.png)

选择这一款是因为从测评来看 Air 和 Pro 的性能差别并不显著，也不想为了 Touch Bar 和屏幕亮度支付额外 2000 元的价格，不如把这个钱加到内存上。

说到内存，新的 Mac 使用了「统一内存架构（UMA）」，可以消除 CPU 和显卡等专用计算单元之间的内存拷贝，既提高了速度，又减少了内存使用。一些朋友表示 8G 的内存对于不开虚拟机的中度使用也非常够用，但相信硬件的提升很快就会被软件消化，如果你希望新的 Mac 有一个比较长的使用周期，还是建议升到 16G 内存。对于新的 Mac 来说最高也只能选配 16G 内存，据说是因为总线 IO 的瓶颈，只有 2 个雷电接口也是这个原因。

至于存储空间，我属于最低的存储空间都够用的那一类人 —— 我希望设备上有最高性能的本地存储，但我并不会用这么昂贵的空间去存储冷数据，毕竟我才刚刚花了大功夫 [自己搭了一个 NAS](https://zhuanlan.zhihu.com/p/273394399)。

拿到 MacBook Air 开始，最亮眼的还是发热和续航的表现，我偶尔会把 MacBook 放在腿上使用，之前的 Intel MacBook 十几分钟就会觉得烫，而 M1 Mac 则在日常使用时几乎感觉不到温度，在 CPU 跑满的情况下温热，只有 CPU 和 GPU 同时跑满才会有烫的感觉。相应地，M1 的续航表现也非常亮眼，后面的性能测试中会有详细的说明。

然后把它和我们家其他的 Mac 对比一下跑分，果然是用最低的价格提供了最高的分数：

| Mac             | Air (M1) | Pro (2020) | Pro (2017)    | mini (2018)   |
|-----------------|----------|------------|---------------|---------------|
| CPU             | M1       | I5-1038NG7 | I5-7360U      | I7-8700B      |
| GPU             | 7-Core   | Iris Plus  | Iris Plus 640 | Intel UHD 630 |
| Memory          | 16G      | 16G        | 8G            | 16G           |
| Geekbench SC    | 1678     | 1136       | 852           | 1117          |
| Geekbench MC    | 7225     | 4237       | 2020          | 5621          |
| Geekbench Metal | 19138    | 8498       | 4930          | 3776          |
| Price           | ¥9499    | ¥14499     | ¥11888        | ¥11909        |

> 数据来自 everymac.com 和 geekbench.com

其中 MacBook Pro 2020 是我 2020 年初时购买的最后一代 Intel MacBook，使用第十代 i5，倒是没什么问题，只是目前来看就买得实在太亏了；MacBook Pro 2017 是蛋黄一直在用，最近她开始学习 Swift 就一直在吐槽电脑实在太慢了，同时电池也进入了待维护状态；Mac mini 2018 是我目前工作用的电脑，当时虽然选了最高配的 i7 CPU，但没考虑到 Intel UHD 630 的性能实在太差了，即使我只是接了一块 4k 屏，系统的界面响应就已经非常卡顿了，现在 GPU 成为了整台电脑的瓶颈。

## ARM 生态
应该说这次从 x86 到 ARM 的切换比我想象中的要顺利，苹果的第一方应用和 masOS 独占的应用都第一时间进行了适配，其他没有适配的应用则可以用 Rosetta 2 来运行。Rosetta 2 用起来是完全无感的，系统会自动将 x86 的应用以转译的方式来运行，无论是图形界面应用还是命令行的 binary 文件。性能上的差别对于大部分应用来说也并不明显，很多时候感觉不到自己是否使用了 Rosetta 2。

M1 芯片之前对我来说最大的变数在于对 Docker 的支持，但就在前几天 Docker for Mac 也发布了 [针对 M1 芯片的测试版本](https://docs.docker.com/docker-for-mac/apple-m1/)。测试版中默认会运行一个 ARM 架构的 Linux 虚拟机，默认运行 linux/arm64 架构的镜像（说起来在 M1 之前 linux/arm64 大概主要是被用在树莓派上吧）；对于没有提供 linux/arm64 架构的镜像则会自动使用 QEMU 来运行 x64\_64 的镜像，性能就比较差了。

macOS 吸引我的一大理由就是 Homebrew —— 可能是桌面开发环境中最好用的包管理器。在 M1 上 Homebrew 目前 [推荐大家使用 Rosetta 2 来运行](https://brew.sh/2020/12/01/homebrew-2.6.0/)，所安装的包也都是需要 Rosetta 2 转译运行的 x86 版本，即使这个包已经提供了 ARM 版本。

这是因为 Rosetta 2 虽然可以完美运行 x86 的 binary，但当一个脚本中会以字符串的方式传递架构名、会调用多种不同的架构的程序，且这些程序同样关心当前的架构时就出问题了，不同的程序无法对这台机器的架构达成一致 —— 这往往发生在编译脚本里，也就是 Homebrew 的主要工作。解决这个问题目前只能是让整个脚本都运行在 x86（即 Rosetta 2）下，Homebrew 目前也是这样做的。

当然你可以选择在另外一个路径 [安装 ARM 版的 Homebrew](https://github.com/mikelxc/Workarounds-for-ARM-mac) 来安装 ARM 版的包，但目前这种方式缺少官方指引、需要自己尝试一个包的 ARM 版是否可以工作、需要从源码编译。目前大多数无法工作的包是受限于上游依赖的发布周期（如支持 darwin/arm64 的 Go 1.16 要等到 2021 年二月才会发布），对于不涉及特定架构、或已经在其他平台提供有 ARM 版本的包，届时只需重新编译就可以提供 ARM 版本。

M1 的 Mac 可以直接安装 iOS 应用这一点我倒不是很在意，一方面是很多国内的毒瘤应用第一时间就从 Mac 商店下架，不允许安装。另一方面 iOS 基于触屏的交互逻辑本来就不适合 Mac，我也不觉得 Mac 之后会加入触屏的支持。

## 性能测试
以极低的功耗实现高于之前 MacBook 的性能是这次 M1 Mac 的亮点，在我购买之前实际上就已经看了很多视频自媒体的测评，在他们的测试中 M1 Mac 在使用 Final Cut Pro X 进行视频剪辑和导出有着碾压级的性能表现。

但显然这并不能代表 M1 在所有工作负载下的表现，因此我根据我日常的工作负载设计了 7 组共 15 项测试，主要将搭载 M1 的 MacBook Air 和我目前在使用的最后一代 Intel MacBook Pro (2020, i5 10th) 进行对比，以下数据均以后者为基准。

| Name                                   | MacBook Pro (i5 10th) | MacBook Air (M1, x86)   | MacBook Air (M1, ARM) |
|----------------------------------------|-----------------------|-------------------------|-----------------------|
| Node.js npm install                    | 2m 41s                | 1m 38s (+39%)           | 1m 2s (+61%)          |
| Node.js webpack build                  | 54s                   | 38s (+30%)              | 27s (+50%)            |
| Xcode build Swift SDK                  | 11m 30s               | N/A                     | 6m 47s (+41%)         |
| Xcode start iOS Simulator              | 49s                   | N/A                     | 16s (+67%)            |
| Docker Redis benchmark                 | 128k QPS              | 133k QPS (+4%)          | 261k QPS (+96%)       |
| Docker build Node.js app               | 2m 56s                | 4m 43s (-61%)           | 3m 17s (-12%)         |
| Visual Studio Code startup             | 7s                    | 17s (-142%)             | 3s (+57%)             |
| Visual Studio Code open and close tabs | 36s                   | 37s (-3%)               | 40s (-11%)            |
| Chrome Speedometer 2.0                 | 88 times/m            | 121 times/m (+38%)      | 214 times/m (+143%)   |
| Safari Speedometer 2.0                 | 111 times/m           | N/A                     | 227 times/m (+105%)   |
| Safari 10% battery for Bilibili        | 32m                   | N/A                     | 1h 50m (+244%)        |
| Final Cut Pro X background rendering   | 9m                    | N/A                     | 6m 20s (+30%)         |
| Final Cut Pro X export H.264           | 8m 25s                | N/A                     | 7m 8s (+15%)          |
| Steam Oxygen Not Included              | 25 ~ 40 fps           | 45 ~ 50 fps (+25 ~ 80%) | Not support           |
| Steam Sid Meier's Civilization VI      | p99 22 fps            | p99 51 fps (+132%)      | Not support           |

对于 Node.js 依赖安装、前端项目构建、Swift 代码编译这些 CPU 密集且内存访问频繁、其中一些步骤依赖单核性能的场景，M1 有着非常明显的提升，即使使用 Rosetta 2 转译也要显著好于 i5。

最值得一提的是得益于 M1 的统一内存架构的高带宽和低延迟，Redis 跑出了 26 万 QPS 的成绩（无论是否在 Docker 中这个数据都差不多），而 i5 仅有 6 万。在调整 redis-benchmark 的数据长度参数时，M1 的结果几乎没有什么变化，而 i5 则随着数据长度的增加 QPS 逐步下降。说不定未来搭载 M1 的 Mac mini 会成为运行遇到 CPU 瓶颈的 Redis 的最佳硬件。

而使用 Docker for Mac 构建镜像则没有提升，这可能是因为构建的过程有很多零散的 IO，CPU 会有比较多的时间休息。而如果使用 Docker 去构建 x86\_64 架构的镜像的话，性能损失就非常严重了（-61%）。

我编写了一个反复开关标签页的脚本来测试 VSCode 的性能，结果表明对于这类负载并不重的 GUI 程序，Rosetta 2 转译并不会影响性能，同样编译到 ARM 也不会对性能有多少提升，Rosetta 2 主要是会比较明显地增加启动速度。在 VSCode 的测试数据中出现了比较奇怪的现象 —— Rosetta 2 转译的版本竟然比 ARM 还快，我目前倾向于这是实验的误差，两者的速度实际上是几乎相同的。

在浏览器的测试中我们选择了 Speedometer，它会运行上百个由主流 Web 框架编写的 Todolist。结果显示无论是 Chrome 还是 Safari，其 ARM 版本都有一倍以上的性能提升，同样即使经过 Rosetta 2 转译也仍然比 i5 要快。浏览器的场景其实和前面 Node.js、Swfit 和 Redis 很像，都是 CPU 密集且内存访问频繁、其中一些步骤依赖单核性能，这也是 Intel CPU 之前的痛点。

我还基于浏览器进行了续航测试，我在中等亮度下播放 Bilibili 上 4K 120 帧的视频，开启弹幕的情况下 M1 使用前 10% 的电池播放了惊人的 1 小时 50 分钟，在这段时间的日常使用体验也是如此，我毫不怀疑官网给出的 18 小时视频播放时间。

在 Final Cut Pro X 的视频渲染和导出上，虽然 M1 确实有提升，但远不如之前一些媒体宣传的那么夸张，目前我还不清楚原因。

游戏方面我测试了我经常玩的 Oxygen Not Included（缺氧）和 Sid Meier's Civilization VI（文明 6），我使用的都是中后期的存档、默认画面预设，在大多数时间都有 50 帧以上，是完全可以流畅游玩的。

可以看到 M1 的 Mac 在之前低配的价位上实现了中配甚至高配的计算性能，得益于专用的加速芯片，在苹果第一方和 macOS 独占的应用上有非常惊人的表现，而对于必须经过 Rosetta 2 转译的应用，仍有可以接受的性能表现，也是远高于之前同一价位的 Mac 的。

## 多用户模式
因为蛋黄和我对新的 MacBook 都很有兴趣，因此我们各建了一个账户，这段时间是在轮流使用这台 MacBook，这也是我第一次使用 macOS 的多用户模式。整体体验还是很不错的，macOS 允许两个用户同时登录，在不退出程序的情况下在两个用户间切换，这使得我和蛋黄同时使用一台电脑的体验非常流畅。

16G 的内存也非常够用，即使另外一个用户运行了 XCode、Final Cut Pro X 或大量标签页的 Chrome，也不会有任何感觉。倒是 256G 的存储空间对于两个用户同时使用有些不够，不过这样的状态应该不会持续太久，后面我也会入手一台 M1 的 Mac。

## 对 Mac 的展望
Rosetta 2 为什么会有这么好的性能呢？之前 Surface 等 x86 模拟器性能不佳的一个原因是 x86 与 ARM 在一个有关内存顺序的机制上有着不同的行为，在 ARM 上模拟这一行为会导致很大的性能损失。而苹果选择直接 [在 M1 芯片中实现了一套 x86 的内存机制](https://twitter.com/ErrataRob/status/1331735383193903104)，大大加速了 Rosetta 2 的性能。据说苹果同样在芯片层面对 JavaScript 和 Swfit 中一些特定场景进行了优化，还有大量的专用计算芯片来加速编视频编解码、密码学计算等特定的任务。

这是一个非常有趣的方向，过去很长一段时间都是应用来适配芯片，但只要对硬件和操作系统的控制力足够强，芯片也可以反过来去对最常用、性能问题最突出的应用进行芯片层面的优化或加入专用的计算芯片，和应用程序一起进行迭代更新。M1 中有的是对 Rosetta 2 的优化，而下一代的 M2 芯片则可能不再需要 Rosetta 2，而是可以根据需要去优化当时的热门场景。

对于苹果来说切换到 ARM 最重要的是提升了其垂直整合的能力、自主控制 Mac 产品线的更新周期。因为苹果对于操作系统的控制力和对应用生态的号召力，可以最大限度地发挥出自主设计的 ARM 芯片的效果。Windows 阵营当然可以切换到 ARM，会享受到前面提到的一些好处，毕竟苹果已经证明了这条路是可行的。但因为软硬件不是同一家公司控制、Windows 对应用生态的号召力弱，微软又不敢破釜沉舟地投入到 ARM 上，因此短期内可能 Windows 阵营还很难实现。
