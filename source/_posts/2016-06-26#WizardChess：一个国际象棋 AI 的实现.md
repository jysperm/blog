---
title: 'WizardChess: 一个国际象棋 AI 的实现'
tags:
  - AI
  - 国际象棋
permalink: wizard-chess
date: 2016-06-26
---

> 这篇文章由我 6 月末在 LeanCloud 进行的一次技术分享整理而来。

我高一的时候曾读过一本「代码的力量：C/C++ 中国象棋程序入门与提高」，也想自己试着实现一个，连名字都想好了，就叫 Wizard Chess —— 哈利波特中的「巫师棋」。然而直到最近借着 AlphaGo 的热度，我才真正动起手来，代码开源在 [GitHub](https://github.com/jysperm/WizardChess)，因为是纯前端程序，所以你可以直接访问托管在云引擎上的 Demo <http://wizard-chess.leanapp.cn>.

国际象棋是一种「透明」的、「没有随机元素」的博弈游戏，所谓「透明」是说在任一时间，博弈双方对局面的了解都是一致的（而不像牌类游戏看不到对方的手牌），大部分棋类游戏，例如五子棋、围棋都是如此，这类游戏需要的是非常强的逻辑推理能力去遇见若干回合之后的局面，本文介绍的方法也大体适用于这些棋类游戏。

在技术选型上，我选择了用 TypeScript 来编写核心代码以便可以同时运行于浏览器和 Node.js, 借助 TypeScript 的编译期类型检查，可以让我们更早地发现和类型有关的错误，同时 Chrome 本身也有着非常好用的调试器和性能分析器来查找性能瓶颈。前端方面我选择用 React 来编写 UI, Web Worker 来运行计算 —— 毕竟如果在主线程进行 CPU 密集的运算会阻塞事件循环。

最近一段时间，我发现在这种偏重于数据结构的程序中，「不可变」的数据类型将会极大地减少复杂度并且提高性能，但在我调研了 Immutable.js 后并没有直接使用它，因为我觉得可能我不需要它提供的那么复杂的数据结构，而是自己在编码时注意不要修改参数、函数总是返回新的对象。

### 建模

第一步是将国际象的规则建模到代码中，首先是定义一些数据结构来表示国际象棋中的元素（阵营、棋子、棋盘）：

```javascript
enum ChessType {
  king, queen, rook, bishop, knight, pawn
}

enum Camp {
  black, white
}

interface Piece {
  type: ChessType;
  camp: Camp;
}

interface Board {
  /* from 0 to 63 */
  pieces: Array<Piece>;
}
```

然后需要为每一种棋子编写一个「生成走法」的函数，以便我们的程序知道一个棋子有哪些走法可走，在此以国王为例：

```javascript
function generateMovesForKing(board, piece, camp) {
  for target in ([-1, -1], [0, -1], [1, -1], [-1, 0],
                 [1, 0], [-1, 1], [0, 1], [1, 1]) {
    if (target on the board and (target is empty or target.camp != piece.camp)) {
      yield target
    }
  }
}
```

按照国际象棋的规则，国王可以以直线或斜线的方式移动一格，因此上面的代码会检查相邻一格的位置是否在棋盘范围内、是否是空的或者有对面的棋子（吃子）。

然后还需要考虑到我们的程序和外部的输入输出，在国际象棋领域已有一个叫 FEN 的标准来表示当前的局势（各个棋子在棋盘上的位置），下面是一段表示开局状态的 FEN:

    rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR

FEN 为每种棋子规定了一个字母、用大小写表示黑棋或者白棋、用斜线分割不同的行、用数字表示空白。在我们的程序的 Web 界面中有一个填写 FEN 的文本框，当你填入一个新的 FEN 时，棋盘上的棋子会随之改变；反过来当你移动棋子时，FEN 也会跟着改变，这将会让我们后续的调试变得非常简单。

### 局面评估

我们的程序会在每个回合中，从众多可能的走法中选择一个对自己而言最优的走法，所以我们需要一个函数去评估和量化一个走法对我们而言的优势。

```javascript
function evaluate(board: Board, camp: camp): number {
  var ourScore = 0;

  for piece on board {
    if (piece.camp == camp) {
      ourScore += getScode(board, piece)
    } else {
      ourScore -= getScode(board, piece)
    }
  }

  return ourScore;
}
```

这个函数会接受一个棋盘（board）和一个阵营（camp）作为参数，这个棋盘其实就是应用了某个走法之后，各个棋子的位置。这个函数会检查棋盘上每个棋子，如果这个棋子是我方的，就将其代表的分数加到「我方的优势分数」上；如果是对方的，就从我方的优势分数中减去对应的分数。

每个棋子所代表的分数则按照下表来计算：

棋子 | 基础分数 | 每多一种走法的额外分数
------------|--------------|-----------
王 | 10000 | 2
皇后 | 1000 | 2
车 | 500 | 2
马 | 400 | 2
象 | 300 | 2
兵 | 100 |  2

在这里我们凭「直觉」，按照棋子的重要性，给了每个棋子一个基础分数。但如果只有基础分数的话就会出现这样的情况：我们只能区分出出现吃子行为时的优势，如果不发生吃子，那么所有局面的优势都是一样的。为了解决这个问题，我们可以为「每一个可能的走法」再增加两点分数，因为在象棋中，我们可以走到一个格子，就说明我们对这个格子有一定的控制能力（如果对方的棋子走到这个格子我们就可以吃掉它），引入这个代表「灵活性」的分数后，我们会认为有更多走法的局面是更具有优势的局面。

关于局面评估函数应该考虑什么、不应该考虑什么是一个值得思考的话题。因为我们的 AI 主要是靠下文介绍的「搜索」算法来找到最优的走法的，搜索函数会模拟双方的走棋，如果棋子之间存在守护关系，会在搜索中得到体现，有时过于「自作聪明」的评估函数反而会影响到搜索。在五子棋这样简单（搜索树小）的游戏中，我们甚至可以将评估函数精简为一个「判断胜负」的函数，因为按照目前的计算力，是有可能直接在搜索中找到获胜的局面的，而在象棋这种搜索树庞大的游戏中，我们还是需要评估函数的。

在我们的程序中，我将「灵活性分数」做成了一个默认不开启的选项，默认只计算棋子的基础分数，这是因为计算走法是一个相对开销较大的运算，会比较明显地减少搜索层数（减少一层）。

### 极大极小搜索法

棋类游戏的博弈 AI, 最核心的就是搜索算法，即通过轮流模拟双方走棋，找到最优的走法。搜索的层数就是模拟走棋的回合数，搜索层数越深代表博弈程序可以考虑得越远，能力也就越强，响应地消耗的计算资源也越多。

我们首先介绍一个非常简单的搜索算法 —— 极大极小搜索法，这个算法平淡无奇，只是深度优先地轮流模拟双方走棋：

```javascript
function negaMaxSearch(depth: number, board: Board, camp: Camp): number {
  if (depth <= 0) {
    return evaluate(board, camp);
  } else {
    return getAllMoves(board, camp).reduce( (best, move) => {
      return Math.max(best, -negaMaxSearch(depth - 1, board.move(move), anotherCamp(camp)));
    }, -Infinity);
  }
}
```

我将这个算法实现为了递归的形式，参数 depth 用于控制搜索的深度，每递归一层便减少 1, 当减少到 0 的时候结束递归，使用评估函数评估这个局面的优势值；depth 大于 0 时则递归地搜索当前所有可能的走法（getAllMoves），返回其中优势值最大的局面。

注意在进行递归时，我们需要用 anotherCamp 来切换阵营，同时对结果取负值。这是因为在象棋中，博弈双方是轮流走棋的，我们需要先模拟自己走棋，再模拟对方走棋。在模拟对方走棋时，我们需要站在对方的角度来考虑 —— 我们需要找到对我方最不利的走法，因为我们需要假设对方是聪明的，是会尽一切可能针对我方的，所以在递归时我们需要对 negaMaxSearch 的结果取负。

![wizard-chess-negamaxsearch.jpg](https://o5eoc29h5.qnssl.com/wizard-chess-negamaxsearch.jpg)

在我的电脑上，这个算法可以在使用单核心的情况下，花费 1 分钟来搜索 4 层。在开局状态下，搜索树有 9341 个节点，最终评估了 220211 个局面：

    White {search: 9341, evaluate: 220211}
    Black {search: 9341, evaluate: 220211}

### Alpha/Beta 剪支

但其实在前面的搜索树中，有很大一部分节点是「没有意义」的，即无论是否搜索这些节点，对最终的结果都不会有影响，我们可以通过接下来介绍的 Alpha/Beta 剪支算法来跳过对这些无意义的节点的搜索。

![wizard-chess-alphabetasearch.jpg](https://o5eoc29h5.qnssl.com/wizard-chess-alphabetasearch.jpg)

例如在上图中，如果我们从左到右深度优先地搜索走法树，那么右侧灰色的节点就是我们需要跳过的节点。depth=1 最右标有 5 的节点的左侧子树（5 - 5 - 5）被搜索出之后，depth=1 最右标有 5 的节点的最小值就已经被确定为了 5 —— 因为在 depth=2 时我们需要站在对手的角度找到对我方估值最低的走法，既然左侧子树已经找到了 5, 那么无论其他子树的值是多少，这个节点估值都不可能比 5 更大了。

如果 depth=1 最右标有 5 的节点的估值小于等于 5, 那么它对于父节点也是没有意义的，因为在 depth=1 的层我们需要找到估值最高的走法，既然在 depth=1 这层我们已经找到了一个估值为 6 的走法，那么我们就对估值小于等于 5 的走法不感兴趣了，因此图中灰色的节点我们都可以跳过。

```javascript
function alphaBetaSearch(depth: number, board: Board, camp: Camp, currentCamp: Camp, alpha: number, beta: number): number {
  if (depth <= 0) {
    return evaluate(board, camp);
  } else {
    for move in getAllMoves(board, camp) {
      if (camp == currentCamp) {
        alpha = Math.max(alpha,
          alphaBetaSearch(depth - 1, board.move(move), camp, anotherCamp(currentCamp), alpha, beta)
        );
      } else {
        beta = Math.min(beta,
          alphaBetaSearch(depth - 1, board.move(move), camp, anotherCamp(currentCamp), alpha, beta)
        );
      }

      if (beta <= alpha) {
        break;
      }
    }

    if (camp == currentCamp) {
      return alpha;
    } else {
      return beta;
    }
  }
}
```

我们在极大极小搜索法的基础上进行了修改，得到了带有剪支（跳过图中灰色节点）功能的 alphaBetaSearch, 它多了 currentCamp, alpha, beta 三个参数。alpha 表示在当前搜索路径中，我方至少可以得到 alpha 的分数，任何低于 alpha 的局面都不考虑（剪支）；beta 表示在当前搜索路径中，对方至少可以拿到 beta 的分数，任何高于 beta 的局面都不考虑（剪支），因对方不会放任你拿到更高的分数的；而 currentCamp 和 camp 将用于在搜索中区分「我方」和「对方」。

在递归时，我们会区分当前是「我方」还是「对方」。我方走棋时，将最好的估值保存到 alpha, 对方走棋时，我们将最差的估值保存到 beta, 如果某个局面的估值在 beta 和 alpha 之间则进行剪支（break）。

depth |  worst case | best case
------------|--------------|-----------
n | b^n | b^⌈n/2⌉+b^⌊n/2⌋−1
0 | 1 | 1
1 | 40 | 40
2 | 1,600 | 79
3 | 64,000 | 1,639
4 | 2,560,000 | 3,199
5 | 102,400,000 | 65,569
6 | 4,096,000,000 | 127,999
7 | 163,840,000,000 | 2,623,999
8 | 6,553,600,000,000 | 5,119,999

这个表格列出了 Alpha/Beta 剪支搜索在最好和最差的情况下搜索的局面数量级，所谓最好的情况就是每个最左子树都是最理想的估值，其余子树都被剪掉了，最差的情况就是每个子树都有着比左侧子树更理想的估值，因此我们需要搜索所有子树来找到最理想的估值。当然实际情况肯定是会介于最好和最坏的情况之间，在开局状态下，我们的程序表现如下，相比于前面的极大极小搜索，我们剪掉了 95% 的局面，只评估了 15k - 34k 的局面。

    White {search: 1748, evaluate: 15854, cut: 1136}
    Black {search: 2071, evaluate: 34740, cut: 1547}

从上面的数据可以看到很有趣的一点，开局状态下明明黑白双方的棋子位置差不多，但搜索的局面数量却差了一倍。这是因为 Alpha/Beta 搜索会比较严重地依赖搜索每个走法的顺序 —— 如果先搜索的是估值理想的走法，那么就会触发更多的剪支，搜索更少的节点，反之则会搜索更多的节点。而我们完全没有对走法做排序，所以搜索的顺序会取决于棋子在棋盘上出现的顺序 —— 没错，差别就是这么大。

因此在搜索子树的时候，对子树（走法）做一个预先的排序就显得很重要了，可以很大程度地提高剪支的效率。但同时这又是一个很矛盾的事情 —— 我们搜索就是为了找到最好的走法，但在搜之前却又需要先对走法进行一个排序。所以这个排序必须直观而简单，例如优先搜索皇后、车这类重要的棋子，

### 写在后

* GitHub <https://github.com/jysperm/WizardChess>
* Demo <http://wizard-chess.leanapp.cn>

说实话，因为我数学基础比较差，也没有进行太多的性能优化，最后实现出来的 AI 非常地弱，基本每一步棋都很「蠢」，但至少实现了一个棋类 AI 应有的骨架。我今后可能不会继续维护这个代码了，所以相比于代码，可能这篇文章对读者的帮助会更大。

### 参考链接

国际象棋规则：

* https://zh.wikipedia.org/wiki/%E5%9C%8B%E9%9A%9B%E8%B1%A1%E6%A3%8B

FEN:

* https://www.xqbase.com/protocol/pgnfen2.htm
* https://chessprogramming.wikispaces.com/Forsyth-Edwards+Notation

Alpha/Beta 搜索：

* https://chessprogramming.wikispaces.com/Alpha-Beta
* https://www.xqbase.com/computer/search_alphabeta.htm

测试数据：

* https://www.chess.com/analysis-board-editor
* http://zh.lichess.org
