title: "笔记：PHP和PEAR, PHAR, PECL"
tags:
  - 技术
  - PHP
  - 笔记
date: 2013-04-13 08:00:22
---

这三个东西可以算是PHP中的高新技术了, 既&#8221;高科技&#8221;, 又是新东西.

有PHP开发经验的可能见过这几个词, 但真心估计没几个详细了解过的.

它们有一个共同点, 都是用来管理PHP的扩展的.

## PECL

即PHP Extension Community Library, PHP扩展库.

这里的扩展指的是使用C语言编写的动态链接库扩展, 通过`php.ini`配置, 并随PHP进程被装入内存.

常见的PECL扩展比如:

*   apc &#8211; 字节码缓存器
*   xdebug &#8211; 调试工具
*   PDO_xxoo &#8211; 数据库驱动
*   memcache, mongo &#8211; NoSQL数据库驱动
*   markdown &#8211; 文本处理器
*   zip &#8211; 压缩算法

这种动态链接库又分两种, 一种是`用户空间扩展`, 如mongo, markdown, 旨在通过C代码提升性能, 为PHP代码提供更好的抽象.

另一种是`Zend扩展`, 这是对Zend内核(PHP引擎内核)的扩展, 如apc, xdebug.

PECL在Windows上并不好用, 通常的做法是直接下载形式如`php_xxoo.dll`的已编译好的二进制动态链接库.

下载时还应该选择对应PHP版本号, 处理器指令集, 线程安全性的版本.

据说PECL的基础设施还在建设中, 目前有个简陋的网页(http://downloads.php.net/pierre/)可以下载到一部分编译好的Windows PECL扩展.

而在Linux则方便不少, 比如要安装apc, 只需:

    pecl install apc
    `</pre>

    即可, pecl是PHCL的命令行工具, 可以自动完成扩展的安装(通常是下载源代码后自动编译)工作.

    ## PEAR

    即PHP Extension and Application Repository, PHP扩展和应用库.

    这里的扩展和应用, 指的是用PHP编写的软件包, 一系列类库性质的PEAR包会被安装到PHP的根目录, 然后你就可以在你的代码中直接包含(require)这些类库.

    常见的PEAR包如:

*   phpDocumentor &#8211; 文档提取工具
*   PHPUnit &#8211; 单元测试框架
*   DB &#8211; 数据库封装

    PEAR希望创建一个规范化的PHP源代码包仓库, PEAR本身也对源代码的格式提出了一些要求, 以便于让源码包更加通用和规范.

    同时PEAR也是PECL的上级项目, PECL是PEAR的一部分, pecl的命令行工具也包含在PEAR中.

    <pre>`#安装标配的源码包:
    pear install db
    #PEAR也采用了`软件源`的设计, 安装非标配的软件包如phpunit, 需要先添加频道(软件源)
    pear channel-discover pear.phpunit.de
    pear install phpunit
    `</pre>

    ## PHAR

    PHAR即PHP Archive, 起初只是PEAR中的一个库而已, 后来在PHP5.3后被重新编写成C扩展并内置到PHP中.

    PEAR用来将多个.php脚本打包(也可以打包其他文件)成一个.phar的压缩文件(通常是ZIP格式).

    目的在于模仿Java的.jar, 不对, 目的是为了让发布PHP应用程序更加方便. 同时还提供了数字签名验证等功能.

    .phar文件可以像.php文件一样, 被PHP引擎解释执行, 同时你还可以写出这样的代码来包含(require) .phar 中的代码.

    <pre>`require("xxoo.phar");
    require("phar://xxoo.phar/xo/ox.php");
    `</pre>

    PEAR中的很多源码包都通过PHAR打包.

    ## bcompiler

    提到了PHAR, 我还不得不提一下bcompiler, PHP bytecode Compiler, PHP字节码编译器.

    虽然它目前只是个实验性项目. 可以通过pecl安装.

    很多PHP编写的商业软件, 有闭源的需要, 通常它们会选择Zend Guard等商业代码加密软件, 它们成熟稳定, 但也价格昂贵.

    其实bcompiler就能满足这个需求, 它可以将PHP代码编译成字节码, 虽然保密性不及商业加密软件, 但也很难被轻易修改, 而且因为省去了生成字节码的过程, 会有不少的性能提升, 官方表示编译后体积会减少到原来的20%, 性能会提高30%.

    使用bcompiler编译出的PHP字节码文件可以直接使用(就像PEAR那样):

    <pre>`// xxoo.exe 是 xxoo.php 编译后的字节码.
    require("xxoo.exe");

### 题外

有空我写个在线的PHAR和bcompiler编译工具.