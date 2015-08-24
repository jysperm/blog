---
title: Windows下部署 Apache2 + PHP + XDebug + MySQL 开发环境
permalink: 752
tags:
  - PHP
  - 教程
date: 2013-03-18
---

## 为什么选择这几个软件？

* Apache2是老牌的Web服务器, 兼容性和功能都很强大, 因为我们只是开发环境, 不需要考虑性能问题.
* PHP我们选择了比较新的5.4版本, 丢掉了不少历史包袱, 提供了更多的新特征(如数组简写形式).
* XDebug是调试利器, 在代码中可以用XDebug提供的函数来追踪调用栈等等. 还可以配合IDE进行断点调试甚至远程调试.
* MySQL仍是目前与PHP配合最紧密的数据库.

## 测试环境

Windows 7 SP1 64bit

但为了保证兼容性, 我仍选用了各个软件的32bit版本.

## 下载软件包

在Windows下可没有那么方便的包管理器, 难道你打算试试360软件管家?

### Apache

官网: [http://httpd.apache.org/](http://httpd.apache.org/)

进入Download页面, 再进入Other files页面, 进入 binaries/win32 文件夹. 选择合适的版本进行下载.

我选择的是Apache2.2 x86 openssl(httpd-2.2.21-win32-x86-openssl-0.9.8r.msi).

### PHP

官网: [http://www.php.net/](http://www.php.net/)

进入Download页面, 点击Windows binaries, 选择合适的版本进行下载.

我选择的是PHP5.4 VC9 x86 Thread Safe(php-5.4.13-Win32-VC9-x86.zip).

Thread Safe是线程安全的意思, 因为Windows版的Apache2是线程模型, 所以我们需要线程安全的版本.

### XDebug

官网: [http://xdebug.org/](http://xdebug.org/)

进入Download页面, 选择合适的版本进行下载.

我选择的是XDebug2.2 for PHP5.4 VC9(php_xdebug-2.2.1-5.4-vc9.dll).

### MySQL

官网: [http://www.mysql.com/](http://www.mysql.com/)

进入Download页面, 点击MySQL Community Server, 选择合适的版本进行下载, 他会邀请你注册个帐号, 但你也可以不注册, 点&#8221;No Thanks&#8221;就行.

我选择的是MySQL5.6 32bit(mysql-installer-community-5.6.10.1.msi).

这里要数这个MySQL最大了, 200MiB左右&#8230;里面自带了一个很炫的GUI管理工具&#8230;

## 配置PHP

我在这里建议把这些软件都单独安装到一个文件夹, 便于维护, 同时不要放在系统分区, 否则配置权限很麻烦.

在这里我选择把他们都安装到了`D:\`.

然后解压PHP. 把下好的XDebug复制到PHP目录下的ext目录(如`D:\PHP\ext\php_xdebug-2.2.1-5.4-vc9.dll`).

我们将PHP目录中的`php.ini-development`重命名为`php.ini`, 这就是PHP的主配置文件了

### XDebug

打开php.ini, 在末尾配置XDebug, 新增:

    [XDebug]
    zend_extension = D:\PHP\ext\php_xdebug-2.2.1-5.4-vc9.dll
    xdebug.remote_enable = 1
    xdebug.profiler_enable = 1

这样就打开了远程调试, 只要配置一下IDE就可以进行断点调试了.

### 其他扩展

然后我们还需要把常用的扩展打开(如MySQL), 在php.ini中查找`Dynamic Extensions`, 然后取消你需要的扩展前的分号(注释符), 我开启了这些扩展:

    extension=php_curl.dll
    extension=php_gd2.dll
    extension=php_mysql.dll
    extension=php_mysqli.dll
    extension=php_pdo_mysql.dll
    extension=php_pdo_sqlite.dll

分别是: CURL(强大的数据传输工具, 支持HTTP在内的多种协议), GD2(图像处理库), MySQL(经典C风格MySQL接口), MySQLi(面向对象风格MySQL接口), PDO的MySQL和SQLite驱动.

## 配置Apache2

Apache2安装过程没啥好说的, 途中会让你输入服务器名和管理员邮箱, 随便填就行.

安装好之后会在你的Windows上安装成一个服务, 你可以在服务里面设置它是否开机启动, 同时右下角通知区域会有个Apache2的托盘图标.

### PHP支持

然后我们需要配置Apache2使其支持PHP脚本.

打开Apache2的主配置文件(如`D:\Apache2\conf\httpd.conf`), 末尾追加:

    LoadModule php5_module D:/php/php5apache2_2.dll
    PHPIniDir "D:/php"

    AddType application/x-httpd-php .php

第一行中具体的DLL名称要取决于你的Apache2版本.

### URL重写和.htaccess

除此之外还建议开启rewrite模块(URL重写), 以及 .htaccess 支持:

搜索`LoadModule rewrite_module`, 去掉之前的井号.

搜索`<Directory />`, 改为:

    <Directory />
        Options FollowSymLinks
        AllowOverride All
        Order deny,allow
        Allow from 127.0.0.1
    </Directory>

这里设置成了允许本机访问任何目录.

### 虚拟主机

然后我们可以考虑打开虚拟主机支持, 这样我们可以在本机上依靠域名来建立多个站点.

在httpd.conf中搜索`Include conf/extra/httpd-vhosts.conf`, 去除该行前的井号.

显而易见, 我们在这里包含了另一个文件, 虚拟主机的配置就保存在这个文件中.

打开该文件(如`D:\Apache2\conf\extra\httpd-vhosts.conf`), 可以看到默认已经有两个虚拟主机示例了(每个`<VirtualHost>`就是一个虚拟主机).

我们可以不理会它, 当然删除它们也可以.

然后建立我们自己的虚拟主机, 如添加:

    <VirtualHost *:80>
        DocumentRoot "D:/Web/Test"
        ServerName test.2local.tk
    </VirtualHost>

可以看到我们建了一个虚拟主机, 根目录是`D:/Web/Test`, 对应域名是`test.2local.tk`.

2local.tk这个域名是我申请的一个域名, 它以及它的子域永远指向127.0.0.1, 以方便本地测试, 省着改hosts了.

## MySQL

打开MySQL安装程序可以看到一个很炫的安装向导.

这个安装程序中附带了很多插件, 比如for Office的插件, for VS的插件等等. 总之, 依赖条件不满足的插件不装就是了(比如你没装Office, 就不要选择Office插件了).

安装后可以在开始菜单找到名为`MySQL Workbench`的GUI管理工具, 挺好用的.
