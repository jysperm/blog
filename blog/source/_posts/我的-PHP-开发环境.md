title: 我的 PHP 开发环境
tags:
  - 技术
  - PHP
  - 教程
date: 2013-10-19 17:46:23
---

好久没写技术文章了，这篇文章会以一个概览的形式介绍我的 PHP 开发环境，列出我使用的工具，但配置过程不会太详细。

我用了 3 年多的 Linux 桌面，很是不爽，主要是各个软件的体验不够统一，太分裂，太多选择让人无从选择。

而回到 Windows, 则更糟糕，使用 *nix 工具集变得非常折腾，部署 Web 环境也很麻烦，而且我的服务器都是 Linux 的，代码里有些功能是不能运行在 Windows 上的。

因为我偶尔还打打游戏，一个月前，我还是选择回到 Windows 桌面。

但我下面的这些软件几乎都是跨平台的，如果你使用 Linux 桌面，也不会有什么影响的。

我的主机是 Windows 7 x64, 然后跑一个 Arch 的虚拟机，所有代码的运行和调试都在虚拟机中进行。

## Arch 虚拟机

Arch 安装略折腾，但我喜欢它 KISS 的哲学，我用 VirtualBox, 分配 512MiB 甚至 256MiB 就够用了。

网络改成「桥接网卡」然后在路由器设置一个 MAC 绑定的固定 IP, 我给虚拟机的是 192.168.0.105, 而我主机的是 192.168.0.100.

需要装的软件包最核心的有：openssh, nginx, mariadb, php, xdebug.

至于其他一些：vim, mongodb, php-mongo, phpmyadmin 就看个人需要了。

直接在 VirtualBox 的虚拟机窗口上敲命令很不方便，我会装一个叫 VirtuaWin 的虚拟桌面软件，类似于 KDE 的 Workspace(工作区), 把 VirtualBox 的窗口丢到另一个桌面。

然后用 XShell 连 SSH 上去敲命令。

当然你还需要建一个非 root 账户来日常使用，我建了一个 jysperm.

然后你可以修改 `/etc/php/php-fpm.conf`:

    user = jysperm 
    group = jysperm
    `</pre>

    这样 PHP-FPM 的进程会以你的用户来跑，读写文件不会遇到任何权限问题。

    作为开发服务器，可能同时需要开发测试多个项目，每次都要去 Nginx 里面新建站点是很折腾的事情，下面的配置文件可以让你一劳永逸：

    <pre>`server {
        listen 80;
        server_name ~(?&lt;dir&gt;.*)\.ab\.jyprince\.me$;

        access_log /home/jysperm/nginx.access.log;
        error_log /home/jysperm/nginx.error.log;

        index index.html index.php;
        autoindex on;

        root /home/jysperm/$dir;

        location / {
            try_files $uri $uri/ /index.php?$args;
        }

        location ~ \.php$ {
            fastcgi_pass unix:/run/php-fpm/php-fpm.sock;

            fastcgi_index index.php;
            include fastcgi_params;
        }
    }
    `</pre>

    `*.ab.jyprince.me` 这个域名被我解析到了 192.168.0.105, 这样下来，只需访问 `test.ab.jyprince.me`, 就相当于访问位于 `/home/jysperm/test` 中的文件了，以后就不用再修改 Nginx 的配置文件了。

    ## PHPStorm

    我见过最好的 IDE 是 PHPStorm.

    PHPStorm 的 Deployment 功能可以在你每次修改文件后自动部署到服务器，你只需建一个 SFTP 类型的服务器，并把 Arch 虚拟机的信息填上去，然后勾选 Automatic Upload 就好。

    每一个项目都上传到 `/home/jysperm` 下的一个文件夹。

    然后访问 `项目名.ab.jyprince.me` 就行了，一切都是自动的。

    ## 远程调试

    在 Arch 虚拟机中修改 /etc/php/conf.d/xdebug.ini:

    <pre>`zend_extension=/usr/lib/php/modules/xdebug.so
    xdebug.remote_enable=on
    xdebug.idekey=jysperm
    xdebug.remote_host=192.168.0.100
    xdebug.remote_port=9000

然后在 PHPStorm 中新建一个 PHP Remote Debug 即可。

需要调试时，先在 PHPStorm 中打开调试，设上断点，然后让请求带上 `XDEBUG_SESSION=jysperm` 的 Cookie 即可。

调试页面的时候，可以用 [这个工具](http://www.jetbrains.com/phpstorm/marklets/) 生成书签，点击书签就可以控制调试的开关了。

调试 RESTful API 的话我一般会用一个叫 Postman 的 Chrome 扩展，这个应用似乎没有编辑 Cookie 的功能，这样的话，在 HTTP Header 里加上一项 `Cookie:XDEBUG_SESSION=jysperm` 就行了。

## 其他推荐

*   Robomogo &#8211; 跨平台的 Mongo GUI 客户端
*   SourceTree &#8211; Windows 下的 Git GUI
*   Secure Shell &#8211; Chrome 中的 SSH
*   Clover &#8211; 让 Windows 的资源管理器像 Chrome 一样
*   FileZilla &#8211; 跨平台的 FTP 客户端
*   SmartGit &#8211; 跨平台的 Git GUI
*   Sublime Text &#8211; 好用的跨平台编辑器