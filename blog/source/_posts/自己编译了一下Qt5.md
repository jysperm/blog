title: 自己编译了一下Qt5
tags:
  - 技术
  - Qt
date: 2012-10-28 20:26:20
---

Qt5的Alpha和Beta已经出了，正式版[据说](http://qt-project.org/wiki/Qt-5#d50ae403cb49a205bdf789f377f5cfe6)会在2012年11月发布，不过Qt5已经跳票了不止一次了。

我是按照这里的方法编译的：

[http://qt-project.org/wiki/Building-Qt-5-from-Git](http://qt-project.org/wiki/Building-Qt-5-from-Git)

克隆源代码库大概花了2个小时，速度很慢，才30k/s,编译我分了两天，加一起有6个小时。

我的电脑：Ubuntu 12.04 x64   4G内存   AMD Athlon(tm) II X2 250 Processor × 2

* * *

在编译QtXmlPatterns的时候，出了一个大意是“libQtXmlPatterns.so需要libQtGui.so”的错误，编译中断了，

我在`/qtxmlpatterns/src/xmlpatterns/xmlpatterns.pro`中把第三行，由：

    QT = core-private network
    `</pre>

    改成：

    <pre>`QT = core-private network gui

就好了

* * *

我前几天看了看Qt5的文档，有这么几个感兴趣的变化：

*   默认启用C++11
*   新增一组QJson类
*   支持Windows8(不过Android好像还没啥消息)
*   新的信号槽
*   更好的Ipv6和SSL支持
*   新的QML

### 参考

*   [http://www.devbean.info/2012/05/qt5-features/](http://www.devbean.info/2012/05/qt5-features/)*   [http://qt-project.org/search/tag/qt~5](http://qt-project.org/search/tag/qt~5)