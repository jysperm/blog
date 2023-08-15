---
title: BlockChain 与 Ethereum 介绍
tags:
  - 比特币
  - 区块链
  - 密码学
alias: blockchain-slides
date: 2016-05-01
reviews:
  -
    author: zhangyaning
    body: |
      针对这个随机数的生成方案，我想指出，这个方案有两个弊端：

      1. 最后的revealer有作弊的空间。如果前面的所有人都提交了sercet，就可以推算出当前的random是多少，然后可以选择是否reveal。

      2. 要保证至少一个诚实的参与者。因为这个随机数的机制，其实在另外一方面就是随机数的请求方其实是提供一定奖励给随机数参与者，但是如果攻击者可以瞬间发起N次commit，这样后续的参与者因为没有足够的经济激励就会降低参与度。但是从另外一方面讲，参与者的利益可能跟最终随机数的结果有利益相关，所以应该还会参与，所以这种攻击在某种程度上不完全成立。

      另外vitalik提出了另外一种随机数机制：

      就是利用零知识证明的方式。最终的随机数是由所有人提及的数字进行10000000次sha3计算，然后每个人都可以提交。因为提交的窗口期时间限制，矿工不可能在短时间内算出最终的随机数。然后通过链外计算，提交者将正确答案公布，然后挑战者挑战，通过交互证明的方式，找到最终的答案。

      另外：叔父块奖励的机制实际上会带来一种攻击的可能，就是创造大量叔父块。其一，不会降低其收益，其二通过这种方式可以在另外一个层面上降低全网算力，而降低攻击成本。

      - https://www.reddit.com/r/ethereum/comments/4mdkku/could_ethereum_do_this_better_tor_project_is/d3v6djb
      - https://blog.ethereum.org/2016/02/17/smart-contracts-courts-not-smart-judges/

      vitalik的这种方式其实也存在问题。

      假设随机数最后关联的项目奖金非常大，就可以通过不断恶意的挑战，导致最后的随机数没有办法完全认可。然而如果通过提交押金的方式，过高押金的方式又有可能会使诚实的提交者或者参与者无法参与。如果用限制挑战次数的方式，比如N次挑战失败后，就认为提交者是安全的。那么攻击者就可以通过自我提交，并自我挑战的方式攻击。
  -
    author: jysperm
    body: |
      的确随机数生成的问题很难彻底解决，我也分享一些我自己的思考过程。

      在文章中提的「两段式」随机数征集中，攻击者确实可以通过选择性地 reveal 来影响结果，但相比于一段式的征集，攻击者的影响力已经很弱了。攻击者为了在第二阶段即将结束时选择性地 reveal 进而影响到结果，需要在第一阶段提交大量的 hash，如果同时还存在其他攻击者，那么还需要更多的 hash 来在最后时刻和其他攻击者进行「拉锯战」，而且最后也并不一定能够得到自己想要的结果（被其他人抢到了最后一次 reveal 或者没有可用的 hash 可供 reveal 了），因此这个过程中攻击者还是存在非常大的风险的（别忘了如果在第二段不去reveal 是会受到惩罚的 ）。

      另一方面的确如果攻击者发送大量的 hash 会稀释其他参与者的的奖励，但如果我们假设所有参与者都希望干预随机数结果（他们甚至不在乎惩罚），那么所有人都会在最后时刻提交，所以最后时刻会有非常密集的拉锯战，进而使得结果趋向于随机化，所以这是否是一个攻击者越多越安全的设计呢？至于工作量证明，我觉得可能和电子货币的奖励或惩罚没有本质的区别，只不过一个是用计算力，一个是用电子货币，从环保的角度可能还是通过货币奖励更好一些吧。
---

> 这篇文章由我 3 月末在 LeanCloud 进行的技术分享整理而来，假定读者已有基本的密码学知识且对 Bitcoin 的实现有初步的了解。

Blockchain 也叫区块链，可以认为它是 HashTree（散列树）的一种，也正因如此它有着一些和 HashTree 相同的性质：

![blockchain-hash-tree](https://jysperm-blog.pek3a.qingstor.com/blockchain-hash-tree.jpg)

> 图片来自 <http://happypeter.github.io/bitcoin_basics/book/017_merkle_tree.html>

即在一个树状结构中，每个末端节点都有一个散列值，而非末端节点的散列值则是由其所有直接子节点的散列值散列而来，因此每个节点都直接或间接地包含了其所有子节点的信息。进而，只要任意一个末端节点的散列值变化，其所有父节点的散列值都会发生变化，根节点也必定变化。

我可以举一个有关 HashTree 的应用：「100% 准备金证明」，它属于「零知识证明（Zero-knowledge proofs）」的这一类问题。我们可以考虑这样一个场景，Bitcion 的持有者为了进行交易，需要将 Bitcoin 寄存在交易所，理论上交易所可以将这笔钱（所有用户寄存的账户余额）挪作它用，这是用户们不希望看到的，而交易所也希望自证清白：交易所首先公布一个自己所持有的 Bitcoin 地址，供大家确认交易所确实持有这么多 Bitcoin 作为准备金，但如何证明这笔钱确实大于所有用户余额的总和呢？换句话说，如何在不公布每个用户的余额（会泄露用户的隐私）的情况下，让每个用户都认可自己的余额被包含在了总的准备金中呢？

![blockchain-proof-of-reserves](https://jysperm-blog.pek3a.qingstor.com/blockchain-proof-of-reserves.png)

> 图片来自 <http://blog.bifubao.com/2014/03/16/proof-of-reserves>

我们可以构造一个 HashTree，所有的末端节点都代表一个用户，包含了用户余额（`Σ`）和用户标识（如邮箱地址）的散列（`h`），而父节点包含了其子节点的余额总和（`sum`）和所有子节点信息的散列（`hash`）。对于每一个用户而言，只需向其展示他自己的末端节点和兄弟节点、其所有父节点和父节点的兄弟节点即可，因为这个用户可以通过逐步追溯父节点的方式，确认自己的余额被包含在了父节点中，最后进而包含在了根节点中。

这样一来，向每个用户展示的信息只有其自己的信息和一些经过聚合的信息，每个用户都可以在不获知其他用余额的情况下确认自己的余额被包含在了根节点中。上图中有一个小错误，`h` 为 `e4df9d12` 的节点不应该是一个代表用户的末端节点，而应该是一个经过聚合的信息节点（这个节点可以包含一个有 3333 余额的用户，和一个 0 余额的虚构用户）来避免泄漏某个用户的隐私信息。

接下来我们来看一下 Git，其实 Git 是一个非常典型的 Blockchain 应用：

![blockchain-git-objects-example](https://jysperm-blog.pek3a.qingstor.com/blockchain-git-objects-example.png)

> 图片来自 <http://gitbook.liuhui998.com/1_2.html> （GPL v2）

在 Git 中，无论是文件（Blob）、索引（Tree）还是提交（Commit），都有一个由其内容决定的 Hash，如果两个对象有着一样的内容，则有着一样的 Hash。在 Git 中，整个仓库的历史就是一条 Blockchain，每个 Commit 相当于一个 Block，Commit 中包含了前一个 Commit 的 Hash 以及此次修改相关的对象的 Hash，Commit 本身的 Hash 由其内容和这些元信息来决定。

Git 借助 Blockchain 为仓库来确定了一个唯一的历史 ———— 如果一个 Commit 被修改了，在其之后的所有的 Commit 的 Hash 都会改变。当然，因为 Git 只是一个版本控制工具，所以并没有阻止你去修改历史（毕竟还可以 rebase 然后 `push --force`），但这种修改会被所有协作者察觉到。

另一个 Blockchain 的经典应用就是 Bitcoin 了，也正是 Bitcoin 将 Blockchain 这个词传播开来（而这个概念其实是一直都有的）：

![blockchain-bitcoin-block-data](https://jysperm-blog.pek3a.qingstor.com/blockchain-bitcoin-block-data.png)

> 图片来自 <https://commons.wikimedia.org/wiki/File:Bitcoin_Block_Data.png>（CC-BY-SA-3.0）

在 Bitcoin 中，每个 Block（块）包含了一系列 Transaction（交易）和上个 Block 的 Hash，而整个 Blockchain 则构成了一个去中心化的唯一账本。因为每十分钟才会产生一个新的 Block，而 Block 一经产生就会永远留在 Blockchain 上，所以 Blockchain 将交易发生的顺序固定了下来，维护了交易发生的先后顺序，进而确定一个账户是否有足够的余额发起一笔交易。

## Bitcoin

这个分享的第一个部分是简单地回顾一下 Bitcoin.

Bitcoin 中 Block 的产生是通过「工作量证明」来实现的，即所有参与「挖矿」的「矿工」都要进行一种与计算力相关的、具有随机性质的散列计算，直到算出一个满足特定条件的随机数，才能获得发布一个 Block 的权利。

在设定上，每个矿工总是会去信任「最长的链」，在已知的、满足规则的最长的链的基础上去计算下一个 Block，否则你的计算力就会被白白浪费掉 —— 因为其他矿工也总是认可最长的链，而如果你不在最长的链的基础上开始工作，那么就是在和其他所有矿工的计算力对抗。

Bitcoin 被设计成每 10 分钟生成一个新的 Block, 这个时间是由大家共同通过观察过去几个 Block 的间隔时间，去调整下个 Block 的生成条件的难度去实现的。当过去几个 Block 的生成速度高于预期时，大家就会认为下一个 Block 的生成应该具有更高的难度。

正常来说，每一个 Bitcoin 节点都需要存储完整的 Blockchain 数据才能去确认一笔交易是否合法 —— 交易的发起者是否拥有足够的余额发起这笔交易。但现在完整的 blockchain 已有 66G，而且还在以每天 0.1G 左右的速度增长。如果要求 Bitcoin 的每个用户都存储完整的区块链未免过于苛刻，因此 Bitcoin 拥有一个「简化确认（SPV, Simplified payment verification）」的机制，所谓的「轻量级客户端」可以选择不存储完整的区块链，而是附着到一个或几个完整节点上，只存储所有 Block 的元信息（Hash、包含交易的 Hash、工作量证明），然后验证每个块的工作量证明，每当需要验证交易时便向完整节点查询这个交易所在的 Block，然后获取这个 Block 中必要的信息（Block 中的交易也是以 HashTree 的方式存储的），以便校验这笔交易是否包含在 Blockchain 中。

![blockchain-bitcoin-state-machine](https://jysperm-blog.pek3a.qingstor.com/blockchain-bitcoin-state-machine.png)

> 图片来自 <https://github.com/ethereum/wiki/wiki/White-Paper>

* Blockchain ↔ 账本 ↔ 状态变更日志
* Transaction ↔ 交易 ↔ 一次状态变更
* Block ↔ 对于当前状态的一次「共识」

其实我们可以将 Bitcoin 的 Blockchain 想像成一个「状态机」，整个 Blockchain 是一个有状态的「账本」，其中存储着每一笔交易记录，根据这些交易记录可以推算出整个账本在任一时间的「状态」—— 即 Bitcoin 网络中每个账户有多少余额。每个 Transaction 就是一次对状态的变更，而每个 Block 是整个 Bitcoin 网络的矿工对当前状态的一个「共识」，因为 Bitcoin 每 10 分钟生成一个新的 Block，相当于每 10 分钟大家会对所有的账户的余额达成一次共识，而在这十分钟之间，账本的状态其实是一种「混沌」的状态。

## Alt Coin
在比特币的基础上也衍生出来了很多其他密码学货币，通常被称为「山寨币（Alt Coin）」，通常这类货币有两种实现方案：

第一种是使用自己的、和 Bitcoin 相独立的网络，这样的好处是山寨币可以非常灵活地设计自己的协议和规则，但因为用户量很难达到和 Bitcoin 相当的数量级，所以对恶意攻击的防御能力将非常地弱。

第二种是去使用 Bitcoin 的网络实现「元协议」，在 Bitocin 的 Transaction 之上附带自定义的信息来实现自己的逻辑，这样的好处是可以利用 Bitcoin 的计算力规模去抵御攻击，但同时因为依附在 Bitcoin 网络上，并不是所有的矿工都会遵守山寨币的规则，因此无法防止不符合规则的 Block 进入 Blockchain，只能在客户端上过滤掉不符合规则的交易，也就无法利用前面提到的 Bitcoin 提供的简化确认的功能了。

对于这些山寨币而言，Bitcoin 可以提供一个具有大量矿工参与的、能够抵御住很大规模的恶意攻击的 Blockchain，同时 Bitcoin 的 Transaction 上也可以搭载自定义的数据，给山寨币的实现留出了一定空间。

Bitocin 也提供了一个 [Bitcoin Script](https://en.bitcoin.it/wiki/Script) 用来实现更为复杂的 Transaction 但因为这并非是 Bitcoin 的核心功能，所以只能进行比较简单的运算，只能非常有限地读取 Blockchain 上的数据，同时因为缺少循环机制，很难编写通用的、图灵完备的逻辑。

## Ethereum

![blockchain-ethereum](https://jysperm-blog.pek3a.qingstor.com/blockchain-ethereum.png)

> 图片来自 <https://www.ethereum.org/assets> （CC 3.0）

「Ethereum（以太坊）」是一个基于区块链的、去中心化的应用平台，它将 Bitcoin 的基础设施 —— 基于密码学的区块链技术构建为了一个通用的平台，并补齐了 Bitcoin 网络的一些缺失功能，以便开发者将自己的去中心化应用运行在 Blockchain 上。

在详细介绍 Ethereum 之前，我先介绍一下（我所认为的）去中心化网络的两大基础 —— 密码学和博弈。密码学自然不用多说，无非是通过公钥加密、数字签名、散列和摘要算法去从数学上保证安全性；而博弈是说在去中心化的网络中，任何人，包括希望恶意地希望攻击这个网络的人都可能参与，在设计去中心化网络时需要站在每一个参与者的角度去思考其利益关系，确保遵守规则时利益最大化、违反规则时会遭受损失或承担风险。

然而在数字世界中，发布一段数据是没有成本的，无所谓「利益」和「损失」，因此必须和实体世界建立某种联系，才能去定义「利益」。例如在 Bitocin 网络中，如果攻击者希望去人为地改变 Blcokchain 的走向，需要拥有比其他所有矿工更高的计算力，而在实体世界中，计算力是需要计算设备来提供的，而计算设备是需要从实体世界购买的 —— 甚至有时候即使有钱也没有足够的产能，因此参与 Bitcoin 网络的矿工越多，它抵御攻击的能力将会越强。

所以说在去中心化网络中，并不是所有问题都是被「技术」解决的，在技术所达不到的部分，必须通过利益、通过经济激励来解决。也是因为「经济激励」的需要，Ethereum 也有一个钱包体系（货币单位叫「Ether（以太）」），每个用户有一个钱包地址作为其唯一标识，在这一点上和 Bitcion 比较类似。

「Contract（合约）」是 Ethereum 所引入的最重要的概念。在 Bitcoin 中，所有的地址都是属于一个用户的 —— 当我们说「用户」的时候，其实是说一对公钥和私钥。但在 Ethereum 中，除了由一个密钥对所拥有的地址之外，还有一种由「代码」拥有的地址，即 Contract. Contract 由用户发布，其本质是一段代码，在发布之后便无法修改，Contract 像普通账户一样也有一个钱包地址，每当这个地址收到交易时，所关联的代码便会被执行，这些代码：

* 能且只能以区块链作为输入和输出，因此计算是可重复的 —— 实际上计算的结果并不需要被存储到区块链，因为随时可以重新进行计算。
* 可以调用其他 Contract 中的函数（其他 Contract 的代码和数据同样存在于区块链上）。
* 执行过程中可以创建新的交易（操纵自己的钱包余额），这些交易可能会去执行其他的 Contract.

首先举一个「多人共同持有的钱包」的例子，在 Ethereum 的官方客户端中便有一个创建多人钱包的功能：

![](https://r2-lc-cn.jysperm.me/pictures/2016/ethereum-multi-sig-wallet.jpg)

如图，通过这个功能可以创建出一个与其他 2 个人共同拥有的钱包地址，每个人每天最多使用其中的 100 Ether，如果超过了这个限制，则必须经过另外一个人的同意。

这个功能实际上会创建出一个 Contract，而上述逻辑是通过 Contract 中的代码来描述的。当你希望从这个共有钱包中支出款项时，你需要向这个共有钱包发一个消息（交易即消息，交易金额可以为零，仅携带数据），然后共有钱包中的代码会被执行，若这个支出请求符合上述逻辑，则发起真正的支出交易，否则这个支出请求会被驳回（没有真正地支出款项）。

另外一个例子是「对冲合约」，一直都有人吐槽 Bitcoin 作为数字货币其币值（和法定货币的汇率）不稳定，经常出现一天之间币值涨一倍或跌一倍的情况，但如果借助 Contract 实现一个对冲合约便可一定程度上解决这个问题。

我们将希望保持币值不变的人称为「风险规避者」，将另外一个愿意承担币值波动的风险并从中盈利的人称为「风险承担者」，于是他们便可以约定一个金额（例如 1000 CNY）和一个时间窗口（例如一个月），并创建一个 Contract 执行下列逻辑：

* 风险规避者将价值 1000 CNY 的 Ether 发送到 Contract 的钱包地址，风险承担者也将价值 1000 CNY（或更多）的 Ether 发送到 Contract 来应约（如无人应约，风险规避者可取回自己的 Ether）。
* 一个月后，风险规避者可以从 Contract 取回当时价值 1000 CNY 的 Ether，而无论 Ether 和 CNY 之间的汇率如何，余下的 Ether 由风险承担者取回。

如 Ether 价值上涨，风险承担者获利，若 Ether 价值下降，风险承担者亏损，但风险规避者总是不亏不赚。当然，风险规避者和风险承担者可以事先商定一个风险规避者需要支付的「保费」，亦可商定风险承担者需要提供几倍于 1000 CNY 的担保（倍率越高能够承担的风险越大）。

上面的例子中其实还存在一个不是很好解决的问题，即如何去确定 Ether 和法定货币之间的汇率，在前面我们提到过，Contract 只能访问区块链上的数据，而法定货币是一个存在于实体世界而非密码学世界的数据，我们需要通过某种机制将这类「来自非密码学世界的数据」引入到区块链中。

我们可以设计另外一个 Contract 来指定这样的逻辑，来从实体世界中征集 Ether 和法定货币之间的汇率，在每个时间窗口（如一小时）中：

* 所有人可以向 Contract 缴纳保证金并提供一个汇率。
* 在时间窗口结束时，Contract 计算所有人提供的汇率的平均值（按照保证金加权）并公布。
* 并将收集到的保证金分配（按照保证金加权）最接近平均值的 25% 的人。

对于任何一个参与者，因为不知道其他人的出价，所以提交一个真实的汇率有更大的可能性获得奖励，而提交一个很离谱的汇率将会有很大的机率失去保证金。

当然这个规则其中有几个漏洞，比如如果一个人有非常多的保证金，那么他就可以将平均值拉到一个比真实汇率更高或更低的价格的同时拿到奖励，并且使其他一些提供了准确汇率的人失去保证金。但其实在实体世界中也是一样的，如果你有非常多的钱同样可以抬高或打压一种商品的价格，只不过相比于实体世界，电子货币的体量还很小，并不需要太多钱就可以做到；但其实这样恶意地抬高或打压汇率也是有非常大的风险的，因为你不敢肯定自己缴纳的保证金是足够多的，一旦失败将会失去所有的保证金。

另外一个漏洞就是「所有人可以向 Contract 缴纳保证金并提供一个汇率」这个步骤是通过创建交易来实现的，而所有的交易会被写到 Blockchain 上，因此你提交的汇率其实是对其他人可见的，进一步给恶意的攻击者创造了机会，接下来我会通过一个「产生随机数」的例子来介绍如何规避这个问题。

前面我们提到了 Contract 可以读取 Blockchain 上的数据，但 Blockchain 上的数据都是确定的，如果我们要实现一个类似于赌博的应用，该从哪里获得一个随机数呢？

可以想到的一个随机数来源就是下一个 Block 的 Hash，在大多数情况下，这种程度的随机性足够了。但其实矿工是可以在一定程度上操控这个随机数的，假设一个矿工参与了某个赌博，且赌博的收益大于挖出一个块的收益，那么如果这个矿工挖出了一个将会使自己输掉赌博的块，那么显然这个矿工会选择不去公布这个新的块，这一点在单个矿工的计算力越强的情况下越明显。

因此我们需要引入一个类似征集汇率的机制来征集随机数种子，然后在每个时间窗口结束时使用这些种子来计算出一个随机数。但就像征集汇率一样，因为参与者是通过创建交易来实现提交汇率的，因此在一个时间窗口之间，每个人提交的随机数对其他人都是可见的，因此一个已经参与了某项赌博的人可以精心挑选一个随机数种子来使其他人已提交的种子加上新的种子所产生的随机数刚好符合他的期望。

所以我们有必要将征集种子的窗口分为两部分，来取得一个任何人都无法预测和干预的随机数：

* 阶段一：所有人可以向 Contract 缴纳保证金并提供「一个随机选定的种子的散列值」。
* 阶段二：参与阶段一的人向 Contract 提供未被散列的种子。
* 阶段二结束：Contract 将所有合法的种子散列，生成一组随机数并公布；退回阶段二中提供了正确的种子的人的保证金。

在第一阶段你只知道其他人提交的种子的散列值，而不知道实际的种子，因此无法去精心构造一个种子来干预结果；而在第二阶段中，所有人只是在确认第一阶段提交的种子，而不能提交新的，也无法阻止其他人提交种子。

前面我们提到 Bitcoin Script 是没有提供循环、递归、跳转之类的能力的，也许 Bitcoin 是出于控制一段 Bitcoin Script 执行时间的考虑，因为根据图灵的「停机定理」，由图灵完备的编程语言所编写的程序，无法总是仅从静态分析的角度判断其是否会在有限的步骤后结束，这样依赖恶意的攻击者便可以构造一个会引起死循环的 Transaction 来干扰矿工的正常工作。

而 Ethereum 则再次通过「经济激励」绕过了这个问题，Contract 以 opcode（操作码）的形式运行在一个叫 EVM（Ethereum Virtual Machine）的虚拟机上，EVM 是一个自带「计费」的虚拟机，在 EVM 的标准中，根据操作所需要的内存和 CPU 时间，定义了每一种 opcode 所消耗的 Gas，这是一种由 Ether 购得的计算资源。前面提到当一笔交易的目标是 Contract 时，Contract 的代码会被执行，交易的发起者需要为 Contract 执行过程中消耗的 Gas 付费，同时声明一个「愿意支付的最大的 Gas 数量」，如果 Gas 中途耗尽，Contract 的执行将会停止。

然后我们再重新讨论一下「共识间隔」的问题，前面提到 Bitcoin 每 10 分钟出现一个新的 Block，即整个网络每 10 分钟达成一个「共识」，所以通常的 Bitcoin 交易要等上十几分钟才会被确认，在计算力不是很高的早期，可能要等待一个小时（6 个 Block），大家才会认为这笔交易是可靠的。

显然更短的共识时间对用户而言会有更好的体验，为什么 Bitcoin 不缩短出块时间呢？这是因为更快的共识间隔会一定程度上增加「中心化矿池」的优势。所谓「矿池」就是指比特币矿工聚在一起挖矿，矿工无条件地听从矿池的指令，最后和矿池来约定收益分成，显然 Bitcoin 作为一个去中心化系统，并不希望这种中心化的矿池有额外的优势。

当一个矿工 A 挖到一个新的块的时候，他会将这个 Block 广播出去，其他人一旦收到了这个消息，就会立刻基于这个新的块开始工作。而其他人在「A 挖到新的块」和「收到 A 广播的消息」之间这段时间之间的计算实际上是被浪费掉了的，而中心化矿池中的其他矿工则不会有这个问题，因为他们可以更快地得到新产生的块的信息，立刻在新的块的基础上开始工作。

![blockchain-ethereum-without-uncles](https://jysperm-blog.pek3a.qingstor.com/blockchain-ethereum-without-uncles.png)

这个广播的时间可能需要十几秒，对于 10 分钟来讲这点时间并不是十分重要，但如果去缩短共识间隔，中心化矿池的优势将会越来越明显。但 Ethereum 通过引入「叔块（Uncle Block）」的概念解决了这个问题，将共识间隔减少到了 15 秒钟，在支付确认速度上较 Bitcoin 有了很大的提升。

在 Bitcoin 的 Blockchain 中，一个 Block 只能有一个父块，也只能有一个子块。但在 Ethereum 中，一个新产生的块可以有一个父块和若干个叔块。回到上面的例子，如果在 A 挖到新的块但其他人尚未收到广播的时间中，如果有人挖出了一个新的块，但因为广播较晚没有被大家接受，那么这个块有可能成为下个块的「叔块」—— 这个块所代表的工作量证明会被认为是下一个块的一部分（即这个人挖出下一个块的难度降低了），叔块也仅仅提供工作量证明，其中所包含的交易是无效的。这样一来便补偿了较晚收到广播的客户端在低出块间隔情况下的劣势，具体来讲，直接的叔块提供 50% 的工作量证明、二代叔块提供 25% 的工作量证明以此类推，最多会承认最多五代的叔块。

![blockchain-ethereum-uncles](https://jysperm-blog.pek3a.qingstor.com/blockchain-ethereum-uncles.png)

> 图片来自 <https://blog.ethereum.org/2014/07/11/toward-a-12-second-block-time>

## 尚未解决的问题

接下来这个部分我向大家介绍一下 Ethereum 目前尚未解决的几个问题。

首先就是 Ethereum 目前达成共识的方式依然和 Bitcoin 一样是通过 POW（工作量证明）来担保的，只有完成了特定工作量的节点才能够参与 Block 生成的工作，工作量证明的问题就在于会浪费大量的计算力去保证网络的安全性，虽然者也是基于我们前面提到的「经济激励」思想，但其实是可以改进的。Ehtereum 认为更好的方式是用 POS（所有权证明）去代替工作量证明，这样可以极大地提高这个网络的效率 —— 不需要再去进行无意义的计算了。

既然 Ether 本身就是有价值的，那么为什么不用它本身来进行经济激励呢？所谓 POS 就是说大家用所拥有的 Ether 去做担保，即每一个希望参与 Block 生成（传统意义上的挖矿）的节点（被称为验证人）都需要向系统（这里说的系统是指在协议上做规定，所有节点都认为这笔保证金被「冻结」了）缴纳一笔保证金，然后大家用自己的保证金来对可能成为下一个 Block 的 Block 下注（所谓「可能」的一个重要前提就是这个 Block 必须是符合协议规定的），如果这个块真的成为下一个 Block，那么所有下注的节点将会得到奖励，否则保证金将会被罚没。

这个模式其实和 POW 非常类似，在 POW 中，矿工用自己的计算力来「下注」，而且如果一旦有一个链更长，就有必要切换到这个链上继续挖矿 —— 因为参与的人越多的链越有可能成为正确的链，最终大家达成一个共识。而在 POS 中，大家使用自己的保证金下注，大家同样倾向于选择已经被很多其他人下注的块（如果它是合法的话），最后达成一个共识。

POS 势必会增加整个网络的吞吐量 —— 大家不再需要通过进行大量无意义的计算来达成共识了，每个节点的运算量将趋近于执行 Contract 中代码和进行数据验证的计算量。

当然 POS 之所以目前还未被采用，是因为还存在一些尚未解决的问题，其中之一就是和 POW 一样的 51% 攻击问题，在 POW 中集中全网 51% 的计算力是有一定物理限制的 —— 因为计算力需要计算设备来提供；而相比之下在 POS 中收集全网 51% 的 Ether 则相比之下容易一些 —— 只要你有足够的钱。POS 天然地比 POW 更非复杂，要实现上述的工作逻辑，需要处理例如维护有效的验证人列表、保证金的冻结、罚没和返还、提议区块和投注区块、防止验证人之间的结盟攻击、网络分区之后的恢复等等。

另外一个话题是「分片」，无论是 Bitcoin 还是 Ethereum, 目前都是在同一个 Blockchain 上完成所有的交易确认，这极大地限制了一个分布式网络的计算能力 —— 每个节点都需要接收、存储、验算每一笔交易，整个网络的处理能力其实等于一个节点的处理能力。

因此 Ethereum 希望在未来引入一个「分片」的机制，来将整个网络分为若干个部分，之间独立地进行交易验证。但分片之间会通过指针的结构去引用其他分片的数据、通过异步调用的方式去影响其他分片，所以整个网络在用户看来依然是一体的，只不过整个网络的处理能力将会有非常强的可拓展性。目前分片相关的实现还在比较早期的开发阶段，我找到的资料有限，所以就不过多介绍了。

## Contract

这一部分我将会给大家展示一些实际的、可以工作的 Contract 的代码。Contract 可以由很多种不同范式的语言来编写，最终它们都会被编译成 opcode 在 EVM 上执行，今天我们选择以 Solidity 这个类 JavaScript 的语言为例，它是目前维护得最好的一个 EVM 语言。

```javascript
contract Test {
  uint storedData; // State variable

  struct Voter { // Struct
    uint weight;
    bool voted;
    address delegate;
    uint vote;
  }

  event HighestBidIncreased(address bidder, uint amount); // Event

  function func() { // Function
    if (msg.sender.balance < 10 finney) {
        msg.sender.send(10 finney);
    }

    sha256("...");

    address nameServer = 0x72ba7d8e73fe8eb666ea66babc8116a41bfb10e2;
    nameServer.delegatecall("isAvailable", "MyName");
    nameServer.call("register", "MyName");
  }
}
```

以上是一些核心语法的展示，在 Solidity 中你可以声明状态变量（`uint storedData;`），这些变量的值会永远被保存在 Blockchain 上；可以用 `struct` 去声明复杂的数据结构；也可以定义函数，这些函数会在收到交易时被执行，交易的发起者可以选择执行哪些函数，所以一个 Contract 可以提供若干个函数，在函数内可以进行逻辑判断、循环、修改变量的值。

语言内置一些很方便的小功能，例如常见的密码学算法（`sha256`）、单位换算（`10 finney`）、直接书写钱包地址（`0x72ba7d8e73fe8eb666ea66babc8116a41bfb10e2`）等。`msg` 是内置的全局变量，可以从上面读取与此次交易有关的信息，如发起者、金额等。Contract 可以通过两种方式去调用其他 Contract 的代码，`delegatecall` 相当于将另一个 Contract 的代码放到当前上下文执行，就好像引入了一个库函数；而 `call` 则是发起一笔新的交易去触发另一个 Contract 的逻辑。

那么 Contract 如何从 blockchain 上读取和写入数据呢？这个复杂的工作被抽象为了「状态变量」，上面的 storedData 就是一个状态变量。其实 Contract 执行过程中对状态变量的修改并不会保存到 blockchain 中，因为 Contract 执行的都是确定性的计算 —— Contract 的执行由交易触发，执行过程中只能读取 blockchain 上已有的数据，因此只要我们知道历史上每一笔与这个 Contract 有关的交易，我们就可以随时推算出一个 Contract 在某个时间点上各个状态变量的值。

接下来我来展示一个真正可用的 Contract —— 在 Ethereum 网络的基础上发行一个属于自己的代币：

```javascript
contract Coin {
    // The keyword "public" makes those variables
    // readable from outside.
    address public minter;
    mapping (address => uint) public balances;

    // Events allow light clients to react on
    // changes efficiently.
    event Sent(address from, address to, uint amount);

    // This is the constructor whose code is
    // run only when the contract is created.
    function Coin() {
        minter = msg.sender;
    }
    function mint(address receiver, uint amount) {
        if (msg.sender != minter) return;
        balances[receiver] += amount;
    }
    function send(address receiver, uint amount) {
        if (balances[msg.sender] < amount) return;
        balances[msg.sender] -= amount;
        balances[receiver] += amount;
        Sent(msg.sender, receiver, amount);
    }
}
```

> 代码来自 <http://solidity.readthedocs.io/en/latest/introduction-to-smart-contracts.html#subcurrency-example> （MIT）

这个名为 Coin 的 Contract 声明了两个状态变量，`minter` 用来存储这个代币的创建者，在构造函数（`function Coin()`）中将第一笔用于创建 Contract 的交易的发起者赋值给了这个变量；还声明了一个钱包地址到数字的映射表 `balances`, 用来表示每个持有该代币的地址的余额。

`mint` 这个函数中先判断了交易的发起者是否是该代币的创建者，如果是的话就按照函数参数，将一定数量的代币加给指定的地址。`send` 这个函数可以被所有人调用，会从交易发起者的地址扣除一定量的余额（如果有足够的余额的话），加到目标地址上，相当于一个转账的功能。

我们还声明了一个名为 `Sent` 的事件，事件其实并不会有什么实际的作用，只是便于调试时打印关键性事件，未来也会方便轻量级客户端的实现（轻量级客户端只接受事件而不实际执行 Contract）。

![](https://r2-lc-cn.jysperm.me/pictures/2016/ethereum-mix.jpg)

Ethereum 提供了一个叫 Mix 的 IDE 来调试这段代码，在 Mix 的右侧你可以虚构一些 Block 和账户来测试你的 Contract，也可以看到在执行过程中每个状态变量的值的变化情况。值得一提的是 Contract 一旦发布便无法修改，此后的运行完全靠其他人的交易触发，对于每天都在写 Bug 的程序员来讲这一点会令人非常不爽，但是 Contract 的语义本来就是「合约」，一旦你发布了一个合约自然不能去修改它，否则谁还会信任你的合约呢。当然你可以在 Contract 中给自己一些特权（就像前面的 Coin 中那样，只有创建者可以凭空创造代币），但这些代码也存在于 Blockchain 上，其他使用者也是知晓的。

编写完成后我们就可以用 Ethereum 钱包将这个 Contract 发布到网络上了：

![](https://r2-lc-cn.jysperm.me/pictures/2016/ethereum-create-contract.jpg)

发布之后你可以关注这个 Contract，随时点到 Contract 的详情界面：

![](https://r2-lc-cn.jysperm.me/pictures/2016/ethereum-wallet-contract.jpg)

在左侧可以看到两个状态变量的值，`minter` 的值就是我自己的地址，`balances` 因为是一个映射表，所以你可以输入一个地址去查询它的余额。在右侧你可以向这个 Contract 发起新的交易，有一个下拉菜单可以选择 `send` 或是 `mint` 函数，你可以填写传递给 Contract 的参数。因为在这里我们发交易的目的是传递一个消息，而非传递 Ether，所以我们不必设置交易的金额。

接下来我要介绍一个很有趣的 Contract，这个 Contract 实现了一个「庞氏骗局」的效果，即你可以向这个 Contract 支付 1 Ether 来加入这个游戏，之后每加入三个人，就会按顺序支付给先加入的人 3 Ether:

```javascript
contract Pyramid {
    struct Participant {
        address etherAddress;
    }

    Participant[] public participants;

    uint public payoutIdx = 0;

    // events make it easier to interface with the contract
    event NewParticipant(uint indexed idx);

    // fallback function - simple transactions trigger this
    function() {
        enter();
    }

    function enter() {
        if (msg.value < 1 ether) {
            msg.sender.send(msg.value);
            return;
        }

        if (msg.value > 1 ether) {
            msg.sender.send(msg.value - 1 ether);
        }

        uint idx = participants.length;
        participants.length += 1;
        participants[idx].etherAddress = msg.sender;

        NewParticipant(idx);

        // for every three new participants we can
        // pay out to an earlier participant
        if (idx != 0 && idx % 3 == 0) {
            // payout is triple, minus 10 % fee
            uint amount = 3 ether;
            participants[payoutIdx].etherAddress.send(amount);
            payoutIdx += 1;
        }
    }

    function getNumberOfParticipants() constant returns (uint n) {
        return participants.length;
    }
}
```

> 代码简化自 <https://ethereumpyramid.com/contract.html>

代码还算简单，这个 Contract 声明了一个 `participants` 数组用来按顺序存储所有参与者的钱包地址，还是声明了一个 `payoutIdx` 用来记录前多少名参与者已经得到了 3 Ether 的返还。`enter` 实现了这个 Contract 的主要功能，首先是一些参数检查，保证每个参与者都支付了 1 Ether, 然后将新的参与者放到 `participants` 数组的末尾，最后如果当前参与者的序号刚好是 3 的倍数，就发送 3 Ether 给第 `payoutIdx` 个参与者，并将 `payoutIdx` 指向下一个参与者。

## 参考链接

HashTree:

* 白话 Merkle Tree http://happypeter.github.io/bitcoin_basics/book/017_merkle_tree.html
* 100% 准备金证明 http://blog.bifubao.com/2014/03/16/proof-of-reserves
* Git 对象模型 http://gitbook.liuhui998.com/1_2.html

Bitcoin:

* (Alt Coin) NameCoin https://namecoin.info/
* Bitcoin Script https://en.bitcoin.it/wiki/Script
* Simplified payment verification https://en.bitcoin.it/wiki/Scalability#Simplifiedpaymentverification

Halting Problem:

* 计算的极限（二）：自我指涉与不可判定 http://songshuhui.net/archives/75957

Ethereum:

* Ethereum https://www.ethereum.org/
* White Paper https://github.com/ethereum/wiki/wiki/White-Paper
* Toward a 12-second Block Time https://blog.ethereum.org/2014/07/11/toward-a-12-second-block-time

Ethereum Network:

* https://ethstats.net/
* https://etherchain.org
* https://live.ether.camp

Next of Ethereum:

* 友善的小精灵 Casper http://ethfans.org/posts/introducing-casper-friendly-ghost
* 理解 Serenity - 第二部分: Casper http://ethfans.org/posts/understanding-serenity-part-ii-casper
* (Scalability Paper) Notes on Scalable Blockchain Protocols https://github.com/vbuterin/scalability_paper
* Merkling in Ethereum https://blog.ethereum.org/2015/11/15/merkling-in-ethereum/

Contract:

* ÐAPPS http://dapps.ethercasts.com/
* Solidity https://solidity.readthedocs.org
* Ethereum and Oracles https://blog.ethereum.org/2014/07/22/ethereum-and-oracles
* Ethereum Pyramid Contract https://ethereumpyramid.com/
* RANDAO: A DAO working as RNG of Ethereum https://github.com/randao/randao

Contract IDE:

* Mix https://github.com/ethereum/mix
* Web IDE https://chriseth.github.io/browser-solidity
* Virtual IDE http://etherscripter.com/
