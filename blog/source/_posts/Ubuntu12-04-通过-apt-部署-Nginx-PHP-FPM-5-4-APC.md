title: Ubuntu12.04 通过 apt 部署 Nginx + PHP-FPM 5.4 + APC
tags:
  - 技术
  - PHP
date: 2013-02-15 02:46:32
---

## 为什么选择这几个软件，和这几个版本？

*   Ubuntu的新版本一向很坑, bug成堆, 而12.04是一个LTS版本, 稳定性有保证. 而相比于其他发行版, Ubuntu是最易用的.
*   Nginx是一个轻量级的, 擅长并发的Web服务器, 相比于Apache, 它并发性能更好, 占用资源更少.
*   和Nginx配合的话, 毫无疑问要选择PHP-FPM, 它是一个专用于PHP的FastCGI管理器.
*   PHP5.4 版本丢掉了很多历史包袱, 可以获得更高的安全性, 同时还有新的功能, 比如数组的方括号简写形式.
*   APC是一个开源的PHP字节码缓存器, 目前非常活跃, 且非常贴近PHP开发小组, 有望被内置到PHP6中.

## 安装软件包

12.04的默认源里面只有5.3版本的PHP, 而且nginx也比较旧, 所以我们需要自己添加源：

    add-apt-repository ppa:ondrej/php5
    add-apt-repository ppa:nginx/development
    apt-get update
    `</pre>

    如果没有add-apt-repository这个脚本则需要：

    <pre>`apt-get install python-software-properties
    `</pre>

    `ppa:ondrej/php5` 这个是来自Debain的最新PHP构建. `ppa:nginx/development` 是来自官方的Nginx构建.

    <pre>`apt-get install nginx php5-cli php5-fpm php-pear build-essential libpcre3-dev
    `</pre>

*   nginx &#8211; Nginx主程序
*   php5-cli &#8211; 命令行模式
*   php5-fpm &#8211; FPM模式
*   php-pear &#8211; PHP包管理器和扩展管理器(包括pecl)
*   build-essential &#8211; 编译环境(需要编译APC)
*   libpcre3-dev &#8211; 经测试APC依赖的一个库

    ## 配置APC

    <pre>`pecl install apc
    `</pre>

    然后pecl会自动下载并编译APC, 但APC没有默认被加入php.ini, 所以我们要：

    <pre>`echo "extension=apc.so;" &gt;&gt; /etc/php5/fpm/php.ini
    cp /etc/php5/fpm/php.ini /etc/php5/cli/php.ini
    `</pre>

    APC 有个自带的监视器, 可以查看缓存的详细信息, 如内存占用, 命中率, 已缓存的文件等等, 有需要的话可以自行复制到Web目录.

    <pre>`cp /usr/share/php/apc.php /root/web/
    `</pre>

    ## 配置Nginx

    创建一个新站点：

    <pre>`cat &gt; /etc/nginx/sites-enabled/web.conf

    server {
        listen 80 default_server;
        server_name xxoo.xo;

        root /root/web;
        index index.html index.php;

        location / {
            try_files $uri $uri/ /index.php;
        }  

        location ~ \.php$ {  
            fastcgi_pass unix:/var/run/php5-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params; 
        }  
    }
    `</pre>

    重启Nginx和PHP-FPM：

    <pre>`service nginx restart
    service php5-fpm restart

把测试网页放到 `/root/web/` 就可以了, 在此我们选用一个PHP探针做测试.

(来自http://www.yahei.net/tz/)

## 性能测试

应该说两台测试机差异很大, 不是很公平(我也说不好是偏向哪一方)&#8230;.大家凑合看

测试用例:  ab -n1000 -c5 http://xxoo.xo/probe.php

(5个线程, 请求1000次).

**Nginx + PHP-FPM + APC**

QPS：1022 (每秒完成请求)

**Nginx + Apache + mod_php**

QPS：51