---
title: PHP built-in WebServer
permalink: 587
tags:
  - PHP
date: 2012-10-01
---

PHP从5.4开始内置一个轻量级的Web服务器，不支持并发，定位是用于开发和调试环境(以下适用于Linux以及Windows).

不得不说，在开发环境使用它的确非常方便.  
很简单，安装好PHP后，切换到你的工程所在目录，执行(确保php.exe在PATH中)：

    php -S localhost:8000

这样就在当前目录建立起了一个Web服务器，你可以通过 `http://localhost:8000/` 来访问  
其中`localhost`是监听的ip，`8000`是监听的端口，可以自行修改.

每个请求的信息会打印在终端窗口，类似:

    [Thu Jul 21 10:48:50 2011] ::1:39146 GET / - Request read

很多应用中，都会进行URL重写，所以PHP提供了一个设置`路由脚本`的功能:

    php -S localhost:8000 lp-main.php

这样一来，所有的请求都会由`lp-main.php`来处理，大多数MVC框架都会有一个类似的路由脚本.

>所以在这里，我有必要给大家介绍一个支持MVC的轻量级的PHP框架——LightPHP：  
>项目地址：<https://github.com/jybox/LightPHP>

####使用XDebug调试
添加下面两行到`php.ini`

    zend_extention=/abosute/path/to/xdebug.dll
    xdebug.remote_enable=1

其中第一行的路径务必为绝对路径，XDebug的配置可参考 <http://xdebug.org/docs/install>

####PHP的其他命令行选项

`-a`选项可以开启一个交互式的PHP终端：

    php -a

`-r`可以直接执行PHP代码：

    php -r 'echo "Hello World";'

`-t`指定build WebServer的根目录,默认会以当前目录为根目录，你可以使用这个选项修改根目录:

    php -S localhost:8000 -t /var/www

- - -

参考资料

* <https://wiki.php.net/rfc/builtinwebserver>
* <http://www.php.net/manual/en/features.commandline.webserver.php>
* <http://www.oschina.net/question/12_62984>
* <http://www.oschina.net/question/12_70049>
