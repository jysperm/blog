---
title: TypeScript：重新发明一次 JavaScript
permalink: typescript-reinvent-javascript
tags:
  - JavaScript
date: 2020-06-10
---
作为一个 Node.js 开发者，我很早便了解到了 TypeScript，但又因为我对 CoffeeScript 的喜爱，直到 2016 年才试用了一下 TypeScript，但当时对它的学习并不深入，直到最近又在工作中用 TypeScript 开发了两个后端项目，对 TypeScript 有了一些新的理解。

## 为 JavaScript 添加类型

大家总会把 TypeScript 和其他语言去做对比，说它是在模仿 Java 或 C#，我也曾一度相信了这种说法。但其实并非如此，**TypeScript 的类型系统和工作机制是如此的独特，无法简单地描述成是在模仿哪一个语言，更像是在 JavaScript 的基础上重新发明了 JavaScript**。

究其根本，TypeScript 并不是一个全新的语言，它是在一个已有的语言 —— 还是一个非常灵活的动态类型语言上添加静态约束。在官方 Wiki 上的 [TypeScript Design Goals](https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals) 中有提到，TypeScript 并不是要从 JavaScript 中抽取出一个具有静态化语义的子集，而是要尽可能去支持之前社区中已有的编程范式，避免与常见的用法产生不兼容。

这意味着 TypeScript 试图为 JavaScript 已有的大量十分「动态」的特性去提供静态语义。一般认为「静态类型」的标志是在编译时为变量确定类型，但 TypeScript 很特殊，因为 JavaScript 本身的动态性，TypeScript 中的类型更像是一种「约束」，它尊重已有的 JavaScript 设计范式，同时尽可能添加一点静态约束 —— 这种约束不会影响到代码的表达能力。或者说，TypeScript 会以 JavaScript 的表达能力为先、以 JavaScript 的运行时行为为先，而静态约束则次之。

这样听起来 TypeScript 是不是很无聊呢，毕竟 Python 也有 Type Checking，JavaScript 之前也有 Flow。的确如此，但 **TypeScript 的类型系统的表达能力和工具链的支持实在太强了，并不像其他一些静态类型标注仅能覆盖一些简单的情况，而是能够深刻地参与到整个开发过程中，提高开发效率**。

前面提到 TypeScript 并不想发明新的范式，而是要尽可能支持 JavaScript 已有的用法。因此虽然 TypeScript 有着强大的类型系统、大量的特性，但对于 JavaScript 开发者开说学习成本并不高，因为几乎每个特性都可以对应 JavaScript 社区中一种常见的范式。

## 基于属性的类型系统
在 JavaScript 中，对象（Object）是最常用的类型之一，我们会使用大量的对象字面量来组织数据，我们经常将很多不同的参数塞进一个对象，或者从一个函数中返回一个对象，对象中还可以再嵌套对象。可以说对象是 JavaScript 中最常用的数据容器，但并没有类型去约束它。

例如 request 这个库会要求使用者将发起请求的所有参数一股脑地以一个对象的形式作为参数传入。这就是非常典型的 JavaScript 风格。再比如 JavaScript 中一个 Promise 对象只需有 then 和 catch 这两个实例方法就可以，而并不真的需要真的来自标准库中的 Promise 构造器，实际上也有很多第三方的 Promise 的实现，或一些返回类 Promise 对象的库（例如一些 ORM）。

在 JavaScript 中我们通常只关注一个对象是否有我们需要的属性和方法，这种范式被称为「[鸭子类型](https://zh.wikipedia.org/wiki/%E9%B8%AD%E5%AD%90%E7%B1%BB%E5%9E%8B)（Duck typing）」，就是说「**当看到一只鸟走起来像鸭子、游泳起来像鸭子、叫起来也像鸭子，那么这只鸟就可以被称为鸭子**」。

所以 TypeScript 选择了一种基于属性的类型系统（Structural type system），这种类型系统不再关注一个变量被标称的类型（由哪一个构造器构造），而是 **在进行类型检查时，将对象拆开，抽丝剥茧，逐个去比较组成这个对象的每一个不可细分的成员。如果一个对象有着一个类型所要求的所有属性或方法，那么就可以当作这个类型来使用**。

这就是 TypeScript 类型系统的核心 —— Interface（接口）：

```ts
interface LabeledValue {
  label: string
}
```

TypeScript 并不关心 Interface 本身的名字，与其说是「类型」，它更像是一种约束。一个对象只要有一个字符串类型的 label 属性，就可以说它满足了 LabeledValue 的约束。它可以是一个其他类的实例、可以是字面量、可以有额外的属性；只要它满足 LabeledValue 所要求的属性，就可以被赋值给这个类型的变量、传递给这个类型的参数。

前面提到 Interface 实际上是一组属性或一组约束的集合，说到集合，当然就可以进行交集、并集之类的运算。例如 `type C = A & B` 表示 C 需要同时满足类型 A 和类型 B 的约束，可以简单地实现类型的组合；而 `type C = A | B` 则表示 C 只需满足 A 和 B 任一类型的约束，可以实现联合类型（Union Type）。

接下来我会挑选一些 TypeScript 具有代表性的一些特性进行介绍，它们之间环环相扣，十分精妙。

### 字符串魔法：字面量
在 TypeScript 中，字面量也是一种类型：

```ts
type Name = 'ziting'

const myName: Name = 'ziting'
```

在上面的代码中，Name 类型唯一合法的值就是 ziting 这个字符串 —— 这看起来毫无意义，但如果我们引入前面提到的集合运算（联合类型）呢？

```ts
type Method = 'GET' | 'PUT' | 'DELETE'

interface Request {
  method: Method
  url: string
}
```

上面的代码中我们约束了 Request 的 method 只能是 GET、PUT 和 DELETE 之一，这比单纯地约束它是一个字符串类型要更加准确。这是 JavaScript 开发者经常使用的一种模式 —— 用字符串来表示枚举类型，字符串更灵活也更具有可读性。

在 lodash 之类的库中，JavaScript 开发者还非常喜欢使用字符串来传递属性名，在 JavaScript 中这很容易出错。而 TypeScript 则提供了专门的语法和内建的工具类型来实现对这些字符串字面量的计算，提供静态的类型检查：

```ts
interface Todo {
  title: string
  description: string
  completed: boolean
}

// keyof 将 interface 的所有属性名提取成一个新的联合类型
type KeyOfTodo = keyof Todo // 'title' | 'description' | 'completed'
// Pick 可以从一个 interface 中提取一组属性，生成新的类型
type TodoPreview = Pick<Todo, 'title' | 'completed'> // {title: string, completed: boolean}
// Extract 可以找到两个并集类型的交集，生成新的类型
type Inter = Extract<keyof Todo, "title" | "author"> // "title"
```

借助这些语法和后面提到的泛型能力，JavaScript 中各种以字符串的形式传递属性名、魔法般的对象处理，也都可以得到准确的类型检查。

### 类型元编程：泛型
泛型提供了一种将类型参数化的能力，在其他语言中最基本的用途是定义容器类型，使得工具函数可以不必知道被操作的变量的具体类型。JavaScript 中的数组或 Promise 在 TypeScript 中都会被表述为这样的泛型类型，例如 Promise.all 的类型定义可以写成：

```ts
function all<T>(values: Array<T | Promise<T>>): Promise<Array<T>>
```

可以看到类型参数可以被用来构造更复杂的类型，进行集合运算或嵌套。

默认情况下，因为类型参数可以是任意的类型，所以不能假定它有某些属性或方法，也就不能访问它的任何属性，只有添加了约束才能遵循这个约束去使用它，同时 TypeScript 会依照这个约束限制传入的类型：

```ts
interface Lengthwise {
  length: number
}

function logLength<T extends Lengthwise>(arg: T) {
  console.log(arg.length)
}
```

约束中也可以用到其他的类型参数或使用多个类型参数，在下面的代码中我们限制类型参数 K 必须是 obj 的一个属性名：

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}
```

除了在函数上使用泛型之外，我们还可以定义泛型类型：

```ts
type Partial<T> = {
  [P in keyof T]?: T[P];
}
```

当定义泛型类型时我们实际上是在定义一种处理类型的「函数」，使用泛型参数去生成新的类型，这也被称作「元编程」。例如 Partial 会遍历传入类型 T 的每一个属性，返回一个所有属性都可空的新类型：

```ts
interface Person {
  name: string
}

const a: Person = {} // 报错 Property 'name' is missing in type '{}' but required in type 'Person'.
const b: Partial<Person> = {}
```

前面我们提到的 Pick 和 Extract 都是这样的泛型类型。

在此之外 TypeScript 甚至可以在定义泛型类型时进行条件判断和递归，这使得 TypeScript 的类型系统变成了 [图灵完备的](https://github.com/microsoft/TypeScript/issues/14833)，可以在编译阶段进行任何计算。

你可能会怀疑这样复杂的类型真的有用么？其实这些特性更多地是提供给库开发者使用的，对于 JavaScript 社区中的 ORM、数据结构，或者是 lodash 这样的库来说，如此强大的类型系统是非常必要的，lodash 的 [类型定义](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/lodash) 行数甚至是它本身代码的几十倍。

### 类型方程式：自动推导
但其实我们并不一定要掌握这么复杂的类型系统，实际上前面介绍的高级特性在业务代码中都极少被用到。TypeScript 并不希望标注类型给开发者造成太大的负担，因此 TypeScript 会尽可能地进行类型推导，让开发者在大多数情况下不必手动标注类型。

```ts
const bool = true // bool 是字面量类型 true
let num = 1 // num 是 number
let arr = [0, 1, 'str'] // arr 是 (number | string)[]

let body = await fs.readFile() // body 是 Buffer

// cpuModels 是 string[]
let cpuModels = os.cpus().map( cpu => {
  // cpu 是 os.CpuInfo
  return cpu.model
})
```

类型推导同样可以用在泛型中，例如前面提到的 Promise.all 和 getProperty，我们在使用时都不必去管泛型参数：

```ts
// 调用 Promise.all<Buffer>，files 的类型是 Promise<Buffer[]>
const files = Promise.all(paths.map( path => fs.readFile(path)))
// 调用 Promise.all<number[]>，numbers 的类型是 Promise<number[]>
const numbers = Promise.all([1, 2, 3, 4])

// 调用 getProperty<{a: number}, 'a'>，a 的类型是 number
const a = getProperty({a: 2}, 'a')
```

前面提到泛型是在将类型参数化，引入一个未知数来代替实际的类型，所以说泛型对于 TypeScript 就像是一个方程式一样，只要你提供了能够解开这个方程的其他未知数，TypeScript 就可以推导出剩余的泛型类型。

### 价值十亿美金的错误
在很多语言中访问空指针都会报出异常（在 JavaScript 中是从 null 或 undefined 上读取属性时），空指针异常被称为「[价值十亿美元的错误](https://www.infoq.com/presentations/Null-References-The-Billion-Dollar-Mistake-Tony-Hoare/)」。TypeScript 则为空值检查也提供了支持（需开启 strictNullChecks），虽然这依赖于类型定义的正确性，并没有运行时的保证，但依然可以提前在编译期发现大部分的错误，提高开发效率。

TypeScript 中的类型是不可为空（undefined 或 null）的，对于可空的类型必须表示成和 undefined 或 null 的并集类型，这样当你试图从一个可能为 undefined 的变量上读取属性时，TypeScript 就会报错了。

```ts
function logDateValue1(date: Date) { // 不可空
  console.log(date.valueOf())
}

logDateValue1(new Date)
logDateValue1() // 报错 An argument for 'date' was not provided.

function logDateValue2(date: Date | undefined) { // 可空
  console.log(date.valueOf()) // 报错 Object is possibly 'undefined'.
}

logDateValue2(new Date)
logDateValue2()
```

在这种情况下 TypeScript 会要求你先对这个值进行判断，排除其为 undefined 可能性。这就要说到 TypeScript 的另外一项特性 —— 其基于控制流的类型分析。例如在你使用 if 对变量进行非空判断后，在 if 之后的花括号中这个变量就会变成非空类型：

```ts
function print(str: string | null) {
  // str 在这里的类型是 string | null
  console.log(str.trim()) // 报错 Object is possibly 'null'.
  if (str !== null) {
    // str 在这里的类型是 string
    console.log(str.trim())
  }
}
```

同样的类型分析也发生在使用 if、switch 等语句对并集类型进行判断时：

```ts
interface Rectangle {
  kind: 'rectangle'
  width: number
  height: number
}

interface Circle {
  kind: 'circle'
  radius: number
}

function area(s: Rectangle | Circle) {
  // s 在这里的类型是 Rectangle | Circle
  switch (s.kind) {
    case "rectangle":
      // s 在这里的类型是 Rectangle
      return s.height * s.width
    case "circle":
      // s 在这里的类型是 Circle
      return Math.PI * s.radius ** 2;
  }
}
```

## 仅仅工作在编译阶段
TypeScript 最终仍然会编译到 JavaScript，再被 JavaScript 引擎（如 V8）执行，在生成出的代码中不会包含任何类型信息，TypeScript 也不会添加任何与运行时行为有关的功能。

TypeScript 仅仅提供了类型检查，但它并没有去保证通过检查的代码一定是可以正确运行的。可能一个变量在 TypeScript 的类型声明中是一个数字，但并不能阻止它在运行时变成一个字符串 —— 可能是使用了强制类型转换或使用了其他非 TypeScript 的库且类型定义文件有误。

在 TypeScript 中你可以将类型设置为 any 来绕过几乎所有检查，或者用 as 来强制「转换」类型，当然就像前面提到的那样，这里转换的仅仅是 TypeScript 在编译阶段的类型标注，并不会改变运行时的类型。虽然 TypeScript 设计上要去支持 JavaScript 的所有范式，但难免有一些极端的用例无法覆盖到，这时如何使用 any 就非常考验开发者的经验了。

编程语言的类型系统总是需要在灵活和复杂、简单和死板之间做出权衡，TypeScript 则给出了一个完全不同的答案 —— 将编译期的检查和运行时的行为分别看待。这是 TypeScript 饱受争议的一点，有人认为这样非常没有安全感，即使通过了编译期检查在运行时依然有可能得到错误的类型，也有人认为 **这是一个非常切合工程实际的选择 —— 你可以用 any  来跳过类型检查，添加一些过于复杂或无法实现的代码，虽然这破坏了类型安全，但确实又解决了问题**。

那么这种仅仅工作在编译阶段类型检查有意义么？我认为当然是有的，毕竟 JavaScript 已经提供了足够使用的运行时行为，而且要保持与 JavaScript 的互操作性。大家需要的只是 TypeScript 的类型检查来提高开发效率，除了编译阶段的检查来尽早发现错误以外，TypeScript 的类型信息也可以给编辑器（IDE）非常准确的补全建议。

## 与 JavaScript 代码一起工作
**任何基于 JavaScript 的技术都要去解决和标准 JavaScript 代码的互操作性** —— TypeScript 不可能创造出一个平行与 JavaScript 的世界，它必须依赖社区中已有的数十万的 JavaScript 包。

因此 TypeScript 引入了一种类型描述文件，允许社区为 JavaScript 编写类型描述文件，来让用到它们的代码可以得到 TypeScript 的类型检查。

描述文件的确是 TypeScript 开发中最大的痛点，毕竟只有当找全了定义文件之后，才会有流畅的开发体验。在开发的过程中不可避免地会用到一些特定领域的、小众的库，这时就必须要去考虑这个库是否有定义文件、定义文件的质量如何、是否需要自己为其编写定义文件。对于不涉及复杂泛型的库来说，写定义文件并不会花太多时间，你也只需要给自己用到的接口写定义，但终究是一个分心的点。

## 小结
TypeScript 有着先进的类型系统，而且这个先进并不是「学术」意义上的先进，而是「工程」意义上的先进，能够切实地提高开发效率，减轻动态类型的心理负担，提前发现错误。所以在此建议所有的 JavaScript 开发者都了解和尝试一下 TypeScript，对于 JavaScript 的开发者来说，TypeScript 的入门成本非常低。

在 LeanCloud，控制台在最近的一次的重构中切换到了 TypeScript，提高了前端项目的工程化水平，让代码可以被长时间地维护下去。同时我们一部分既有的基于 Node.js 的后端项目也在切换到 TypeScript。

LeanCloud 的一些内部工具和边缘服务也会优先考虑 TypeScript，较低的学习成本（谁没写过几行 JavaScript 呀！）、静态类型检查和优秀的 IDE 支持，极大地降低了新同事参与不熟悉或长时间无人维护的项目的门槛，提高大家改进内部工具的积极性。

LeanCloud 的 JavaScript SDK、Node SDK 和 Play SDK 都添加了 TypeScript 的定义文件（并且打算在之后的版本中使用 TypeScript 改写），让使用 LeanCloud 的开发者可以在 TypeScript 中使用 SDK，即使不用 TypeScript，定义文件也可以帮助编辑器来改进代码补全和类型提示。

如果你也希望一起来完善这些项目，可以了解一下在 LeanCloud 的 [工作机会](https://www.leancloud.cn/jobs/)。

参考资料：

- [TypeScript Evolution](https://mariusschulz.com/blog/series/typescript-evolution)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)（[中文版](https://jkchao.github.io/typescript-book-chinese/)）
- [TypeScript Design Goals](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Design-Goals)
- [The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [浅谈 TypeScript 类型系统](https://zhuanlan.zhihu.com/p/64446259)
- [TypeScript类型元编程：实现8位数的算术运算](https://zhuanlan.zhihu.com/p/85655537)
- [编程的智慧](https://www.yinwang.org/blog-cn/2015/11/21/programming-philosophy)（正确处理 null 指针）
- [The worst mistake of computer science](https://www.lucidchart.com/techblog/2015/08/31/the-worst-mistake-of-computer-science/)（[中文版](https://www.open-open.com/news/view/16166e1)）
