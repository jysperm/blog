---
title: 出售WordPress主题是违法的
alias: '1127'
tags:
  - 冷知识
date: 2013-06-29
---

标题党了，应为：出售WordPress主题，并禁止二次分发的行为是违反协议的。

所谓二次分发就是说，我购买了这个主题，然后我又将我买到的主题分享或出售给其他人。

略绕口，听我细细道来。

起因是今天瞧到了一个不错的主题，但是是收费的，于是我又想起来这茬了，开始查相关的资料。

中文的资料没太多的权威性，大部分还是翻的英文的资料。

WordPress使用GPL授权[注1][注2], GPL是一个非常严格的，意图保证源代码自由的协议。

即GPL保障任何人，以任何目使用，获取源代码，修改，分发的自由。

除此之外，GPL还具有苛刻的“传染性”，任何形式的衍生作品，都必须采用同样的GPL协议。

&#8220;Themes are GPL, too&#8221;[注3]这是WordPress创始人Matt Mullenweg于官方博客发表的文章，大意是经过认真地研读GPL和相关法律，WordPress的主题和插件作为衍生作品，必须使用同样的GPL协议。

其理由是，主题和插件与WordPress是不可分割的部分。主题使用了WordPress提供的接口，在运行时，WordPress和主题存在着交叉调用的行为，主题可以控制WordPress运行的几乎所有细节。不能认为WordPress是一个运行环境，而应该认为主题是对WordPress的扩展，是WordPress的衍生作品。

但图片资源, CSS 和 JS脚本例外，因为它们的运行，与WordPress是分离的，在服务器端由Web服务器提供，在客户端由浏览器运行，并未参与到WordPress的运行逻辑中。

所以，主题的PHP(包括混杂了PHP的HTML)文件必须使用GPL授权, 静态资源不受此限制，但因为GPL的规定，它们必须分别单独打包发布，否则会被传染。

Matt Mullenweg还要求SFLC(自由软件法律中心)澄清WordPress主题面临的法律问题，SFLC认可上述观点[注4].

GPL并不限制出售源代码，但关键在于二次分发，GPL保障了购买者二次分发的自由，因此购买者可以随意分享甚至出售购买到的主题。

除非作者提供了额外的服务，如针对性地协助修改源代码，否则在这种情况下很难谈出售了，因为任何人都可以代替你来出售&#8230;

WordPress在其官网[注5]委婉地写道“我们认为主题和插件作为衍生作品应当使用GPL, 但目前这还属于法律上的灰色地带，你至少应当使用Apache, BSD等开源协议”.

而同样是GPL授权的Drupal则强硬得多[注6], 明确要求所有插件必须以GPL发布。对于是否可以出售主题，其写道[注7]“你可以出售主题，但必须保障其他人二次分发的自由”，同时还指出，如果代码经过了混淆或压缩，应当提供未经混淆的版本。

在官网论坛，有人提出[注8], 是否可以自己建立一个网站，收集付费主题，并提供免费下载。回复者表示这种行为是当然是合法的，但是好像在质疑他的动机，这帖子我没大看懂，有点太长了。

同时这篇文章[注9]还指出，法官更可能将WordPress的GPL许可证考虑在先，因此即使主题作者声称禁止二次分发，这种声称也是无效的，任何人依然可以合法地进行二次分发。

结论：

*   WordPress主题和插件是WordPress的衍生作品，必须使用GPL授权
*   可以出售WordPress的主题和插件, 但GPL赋予了购买者二次分发的权利
*   不能发布经过加密，混淆，编译的代码，除非提供一份原始代码
*   即使主题作者声称禁止二次分发，任何人依然可以合法地进行二次分发
*   这样的话，如果仅仅是出售源代码，没有额外的服务，根本不可能收到钱
*   除非将静态资源分别打包，否则它们也会被GPL传染

参考：

*   [注1]: http://wordpress.org/about/license/
*   [注2]: GPL原文 http://www.gnu.org/licenses/gpl.html
*   [注3]: http://wordpress.org/news/2009/07/themes-are-gpl-too/
*   [注4]: http://article.yeeyan.org/view/pestwave/118084
*   [注5]: http://wordpress.org/about/license/
*   [注6]: https://drupal.org/licensing/faq/#q7
*   [注7]: https://drupal.org/licensing/faq/#q9
*   [注8]: http://wordpress.org/support/topic/gpl-themes-for-money-do-i-understand-the-gpl-right
*   [注9]: http://www.blogherald.com/2009/06/22/woothemes-goes-gpl-more-will-follow/
