---
title: 'Play Cards: 探索通用的游戏后端方案'
tags:
  - LeanCloud
  - 游戏开发
permalink: play-cards-realtime-game
date: 2018-11-22
---

当我们公司决定推出一个「多人在线游戏后端解决方案」的时候，我其实很疑惑会有一个「通用」的方案可以解决所有在线游戏的后端需求么？

于是在前一段时间，我尝试开发了一个「多人在线卡牌对战游戏」，支持了「斗地主」游戏规则的一个子集，可以在 [play-cards.leanapp.cn](https://play-cards.leanapp.cn "play-cards.leanapp.cn") 访问到，源代码在 [jysperm/play-cards](https://github.com/jysperm/play-cards "jysperm/play-cards")。不过请不要指望能够匹配到其他玩家 —— 你需要自己开三个窗口，通过左右手互搏的方式来体验游戏，下面是一个演示视频：

[https://streamable.com/belpq](https://streamable.com/belpq)

## 动作同步和状态同步
其实这个游戏的关键就是在多个客户端之间来同步数据、实现联机游戏，为此我先了解了一下业界总结出的两种同步模型：「动作同步」和「状态同步」。

在动作同步（帧同步）中：

- 客户端发送操作，服务器只转发客户端的操作
- 游戏逻辑主要在客户端运行（通常客户端需要掌握所有数据）
- 延迟低，适合 RTS、MOBA、FPS
- 可以让所有客户端有一个完全一致的时间轴

游戏状态的计算必须是确定的，不能有随机数，这样才能保证不同的客户端在应用相同的一系列动作之后能够得到相同的状态（游戏画面）。

在状态同步（C/S 同步）中：

- 客户端发送操作，服务器转发计算后的游戏状态
- 游戏逻辑主要在服务器运行（可以只向客户端发送部分数据）
- 易于反作弊，适合 MMORPG、回合制（卡牌）游戏

因为游戏逻辑需要运行在服务器，所以服务器程序还是必不可少的。

## 选型
因为这是一个实验性质的项目，因此我想同时实现这两种同步模式来进行对比。在这里我挑选了一个回合制、属于非对称博弈的卡牌游戏作为游戏的内容。

我首先实现了动作同步，在动作同步中服务器几乎不需要做什么事情，只是作为一个「消息服务」来转发客户端的动作。于是我在这里使用了 [LeanCloud Play](https://leancloud.cn/docs/multiplayer.html) 来完成这个消息转发的工作，每局游戏对应 Play 中的一个 Room，Play 允许客户端在房间中向其他玩家广播消息。

然后我又尝试将这个游戏改为了状态同步 —— 我引入一个运行在服务器上的特殊客户端（称为 MasterClient）。这个客户端中同样连入 Play 的消息服务，其中运行着完整的游戏逻辑，它将其他真正玩家的动作作为输入，然后输出游戏状态给其他真正玩家的客户端来展示，防止客户端作弊。

## 动作和状态
前面我提到业界已经总结出了两种同步模式，即动作同步和状态同步，「动作（Action）」和「状态（State）」这两个概念会贯穿这篇文章。

动作即玩家对于游戏的「输入」，可以是按键、点击，或者更抽象的动作，例如在这个游戏中我定义了两种动作 —— 出牌和放弃出牌：

	type GameAction = PlayCardsAction | PassAction

	interface PlayCardsAction {
	  action: 'playCards'
	  player: Player
	  cards: Card[]
	}

	interface PassAction {
	  action: 'pass'
	  player: Player
	}

状态即用来表示整个游戏局势所需的所有数据，例如在这个游戏中：

	export interface GameState {
	  players: Player[]
	  playersCardsCount: PlayersCardsCount

	  myCards: Card[]

	  previousCards: Card[]
	  previousCardsPlayer?: Player
	  currentPlayer?: Player

	  winer?: Player
	}

## 游戏抽象
有了动作和状态的概念，我们就可以对游戏进行一个抽象了，我设计了一个 Game 类，是对一局游戏整个生命周期的封装，这个类将会同时运行于客户端和服务器：

	// 事件：action（当前玩家的动作）、stateChanged（游戏状态变化）、error
	class Game extends EventEmitter {
	  constructor(seed: string, players: Player[])

	  // 获取游戏状态（供 UI 调用）
	  public getState(player: Player): GameState
	  // 设置游戏状态（状态同步时），会触发 stateChanged 事件
	  public setState(player: Player, state: GameState)

	  // 当前玩家执行动作，会触发 action 事件
	  public performAction(action: GameAction)
	  // 应用其他玩家的动作（动作同步时）
	  public applyAction(action: GameAction)
	}

在客户端中，当 UI 捕捉到用户的输入时，执行 `Game.performAction`，动作（Action）的执行会改变状态（State），触发 stateChanged 事件，UI 收到这个事件后根据新的游戏状态来重绘 UI。

至于其他游戏逻辑则主要是关于「一组牌能够管得上另一组牌」的判断，在此不再罗列。

## 结构
在这个游戏中，我们将消息转发（由 LeanCloud Play 提供）视作一项服务、视作一个中心。所有玩家的客户端都连接到消息转发服务上，同时每局游戏我们还需加入一个运行在服务器上的 MasterClient 来提供特殊的管理能力。

> 为了将两种同步模式做成可简单替换的，我其实将服务器程序作为了一个必选组件（`master-client` 目录），但这个服务器程序在动作同步中只是负责创建房间（可以移到客户端），并不参与游戏逻辑。

我的代码分为 3 个部分：

	common
	├── game.ts
	└── types.ts
	browser-client
	├── app.tsx
	└── client-sync.ts
	master-client
	├── server-sync.ts
	└── server.ts

- `common` 部分会同时运行在服务器和客户端，包含游戏的核心逻辑
- `browser-client` 是运行在浏览器中的客户端，包含 UI
- `master-client` 是运行在服务器端中的 MasterClient

## 动作同步
我首先实现的是动作同步（`client-sync.ts` 和 `server-sync.ts` 中的 actionSyncController），这种模式下客户端发送动作（Action），服务器只转发动作，游戏逻辑主要在客户端运行，客户端掌握所有的数据（包括其他玩家的手牌）。

客户端的工作：

- `game.on('action')` 时（表示用户在 UI 上进行了一个动作），通过 Play 将动作广播给其他客户端`play.sendEvent(action)`
- `play.on('customEvent')` 时（表示收到其他客户端广播的动作），应用其他玩家的动作 `game.applyAction(action)`

而服务器端几乎没有什么工作，只是帮助客户端创建一个房间而已。

## 状态同步
在状态同步（`client-sync.ts` 和 `server-sync.ts` 中的 statusSyncContorller）中，客户端发送动作（Action），服务器运行游戏逻辑后，转发计算后的游戏状态（State），游戏逻辑主要在服务器运行，客户端只做展现，只知道自己的手牌。

客户端的工作：

- `game.on('action')` 时（表示玩家在 UI 上进行了一个动作），通过 Play 将动作单独发送给 MasterClient `play.sendEvent(action)`（需加参数 `{receiverGroup: ReceiverGroup.MasterClient}`）
- `play.on('customEvent')` 时（表示收到 MasterClient 广播的最新状态），从服务器覆盖游戏状态 `game.setState(state)`

MasterClient 在服务器的工作：

- 为每局游戏创建一个 Game 对象。
- `play.on('customEvent')` 时（表示玩家进行了一个操作），在游戏对象上执行动作 `game.performAction(action)`
- `game.on('stateChanged')` 时，给每一个玩家发送最新的游戏状态 `play.sendEvent(state)`

## 复用代码
在完成这个实验性质的项目后，我们需要来思考一下，哪些代码是可以复用的。

- Game 类为一个游戏的过程提供了一个非常基本的抽象（即通过动作去改变状态），也为数据同步提供了基础的支持（action 事件和 stateChanged 事件）。
- MasterClient 中对房间的管理是通用的，并且还有很大的改善空间，比如支持多实例允许并实现负载均衡等。

我将我使用的这种开发多人在线游戏的方式称之为 MasterClient 模式，它的好处是：

- **在服务器和客户端之间复用大部分的游戏逻辑** 如果你像我一样使用 JavaScript 的话，那么可以在服务器和客户端运行完全相同的代码。
- **单机游戏 =\> 动作同步 =\> 状态同步 的迁移过程非常平滑** 只要一开始能够区分好动作和状态，那么这个迁移的过程中只需改动少数代码。
- **服务器端的游戏逻辑和消息转发服务解耦** 消息转发服务可以更加稳定；MasterClient 则可以更快速地迭代。
- **符合开发者直觉** 至少我作为一个游戏开发的小白是觉得挺符合直觉的

## Play & Client Engine
在我完成这个项目的过程中，我也不断地与公司的同事保持着沟通，经过几个月的努力，LeanCloud 在 Play 基础上发布了 [Client Engine](https://leancloud.cn/docs/client-engine.html) —— 一个用于托管 MasterClient 的容器平台（类似于云引擎），同时我们也提供了一个项目骨架，集成了我前面提到的功能，帮助开发者实现服务器端逻辑：

- **游戏抽象** 提供了一个类似的 Game 类来帮助开发者管理房间和玩家、填充游戏逻辑，在 Play 的基础上提供 RxJS 风格的高层次 API 来操作游戏动作和状态。
- **负载均衡** 提供了一个 GameManager 类来管理房间的创建，允许 Master Client 以多实例的集群模式运行，以便进行横向扩展，消除容量瓶颈。
- **平滑部署** 当你部署新版本的时候，旧实例会等待已有的房间完成游戏再退出，你可以在任何时候部署新的版本而不必担心影响用户的游戏。

> 我的这个项目早于 Client Engine 成型，是对通用游戏后端的一个实验。如果你希望编写类似的游戏，请阅读 Client Engine 的文档，并基于 Client Engine 的脚手架来进行开发，而不要直接基于本项目修改。

## 小结
本文探索的是一种「通用游戏后端」的解决方案，在这个小项目中我们用到了两个 LeanCloud 的服务：Play 和 Client Engine。

- [LeanCloud Play](https://leancloud.cn/docs/multiplayer.html) 扮演的是一个「消息转发服务」，它会维持与所有客户端（包括 Master Client）的长链接，允许客户端之间广播或单发消息。
- [LeanCloud Client Engine](https://leancloud.cn/docs/client-engine.html) 提供了一个可信的服务器端环境来运行客户端 —— 在本文的例子中是 MasterClient，可以将游戏逻辑运行在服务器端来实现反作弊。

借助这两个服务，我们将对游戏服务器的开发需求降到了最低，只需编写运行于服务器端的游戏逻辑即可，而不必关心链接的保持、消息的转发和服务器环境和扩容等问题。
