title: LightPHP v5: 闲聊PHP框架
categories:
  - 技术
tags:
  - LightPHP
  - PHP
  - PHP进阶
  - RP主机
date: 2013-07-05
---

展望LightPHP v4是半年前的事情了：<http://jyprince.me/program/681>.

LightPHP v4算是写出来了，但代码都没经过细致的测试，基本上一边用它写RootPanel一边完善，排Bug, 后来干脆把LightPHP的开发分支丢到RootPanel了。  
刚刚统计了一下，不知不觉这么多代码了(不计空行)：

* cli工具集(PHP和部分参杂了PHP的配置文件模版) - 243行
* 文档(.md) - 251行
* LightPHP核心部分 - 1806行
* LightPHP杂项文件 - 51行
* 配置文件 - 75行
* 控制器(Handler) - 693行
* 核心文件 - 426行
* 国际化(目前仅中文) - 507行
* 数据模型(Model) - 338行
* 独立的CSS - 186行
* 独立的JS - 168行
* 模版文件(参杂了PHP, CSS, JS的HTML文件) - 1479行
* 杂项文件 - 15行
* 引用的其他开源项目：jQuery, Bootstrap, 雅黑工作室的3款探针, 本人的taskinfo.php, Kill-IE6

列得我好有成就感~

总之，写了这么多代码，重构了那么多次，对于PHP的框架，我又有新的体会要说。

----

正在设计和编写中的LightPHP v5应该说和v4相比变化不算太大，但是根据语义化版本控制(<http://semver.org/>)的精神，还是要把它命名为v5.

我有提到，我打算认真写一本PHP的书，暂定《PHP进阶——一个论坛系统的实现》。以我这几年折腾的经验，来谈一谈如何利用好PHP的特征，写出优雅的代码，跳过PHP基础，以一个论坛系统的实现为例，这其中当然也隐含了一个PHP框架的实现。  

部分草稿可以看下面，不过最后成品肯定会有很大变化的：

* http://jyprince.me/program/827
* http://jyprince.me/program/834

这个所谓的“以一个论坛系统的实现为例”, 我打算给它起名 LightTalk. 除此之外我还有另一个论坛系统的项目：JyBBS.  
这两个论坛唯的区别恐怕就是LightTalk是随书的示例，是一个完整的论坛，其部分代码也来自LightPHP, 具有宽松的版权，书写好后不再维护。  
而JyBBS是基于LightPHP的论坛系统，版权略严格，我打算一直维护。

真是乱呢...

----

* 定位

在v4以及之前的版本中，LightPHP虽定位为PHP库，但仍包含了一部分前端模版(v3), 以及Bootstrap, jQuery等东西(v4).  
v5中将删去他们，LightPHP将成为一个纯粹的PHP库。  

    // LightPHP v5的结构

    lp-class/  --  LightPHP的核心类
    lp-config.php  --  配置文件
    lp-load.php  --  用于载入LightPHP
    ...  --  其他杂项文件，如URL重写规则等

* 数据库, Model

LightPHP最初就是从一个MySQL封装开始的(模仿自Abreto), 后来数据库封装也一直是LightPHP的核心部分, 在v3中，我力图实现无关SQL的CRUD.  
v4中我开始模仿MongoDB的链式调用语法，并且打算实现数据库无关，但我好像失败了。  

数据库的差异毕竟是存在的，不可能实现真正的无关，Model不需要处理所有的数据库查询，只要提供最简单的CRUD就够了，复杂的理应交给SQL或具体的数据库API.  
Model是我学习了最长时间的概念，现在我可以说我真正地理解了。

另外v5中我用PDO代替了C Style MySQL API, 毕竟是大势所趋。

    // 抽象的Model基类，以下是经过精简的成员函数列表
    abstract class lpPDOModel implements ArrayAccess
    {
        static public function select($if = [], $config = []);
        static public function find($if = [], $config = []);
        static public function count($if = [], $config = []);
        static public function insert($data);
        static public function update($if, $data);
        static public function delete($if);
        static public function install();
    }

    // 通过继承来“实例化”一个Model, 代码有精简
    class rpUserModel extends lpPDOModel
    {
        static protected $metaData = null;

        // 具体Model特有的常量成员
        const NO = "no";
        const STD = "std";
        const EXT = "ext";
        const FREE = "free";

        // 为lpPDOModel提供元信息，有了这些信息，lpPDOModel不仅可以检查错误，还可以自动完成数据表的构建
        static protected function metaData()
        {
            if(!self::$metaData) {
                self::$metaData = [
                    "db" => f("lpDBDrive"),
                    "table" => "user",
                    "engine" => "MyISAM",
                    "charset" => "utf8",
                    self::PRIMARY => "id"
                ];

                self::$metaData["struct"] = [
                    "id" => ["type" => self::AI],
                    "uname" => ["type" => self::VARCHAR, "length" => 256],
                    "passwd" => ["type" => self::TEXT],

                    // 支持 JSON 格式哦！

                    "settings" => ["type" => self::JSON],
                ];
            }

            return self::$metaData;
        }

        // Model特有的成员函数
        public function isAllowToPanel()
        {
            if($this["type"] != self::NO && !$this->isAdmin())
                return true;
            return false;
        }
    }

    // 查询
    $passwd = rpUserModel::find(["uname" => "jybox"])["passwd"];
    // 插入，可以直接插入数组哦，lpPDOModel会将其 json_encode 后储存为字符串，读取时反之
    rpUserModel::insert(["uname" => "jybox", "settings" => ["key1" => "value1"]]);

* 模版

模版也是LightPHP的早期功能之一，我没有选择Smarty之类的专有语言，我直接用PHP编写模版，毕竟PHP本身也算是一个十分方便的模版语言。  
在v4中，对模版的解析是用eval, 这不仅存在安全问题，而且显得非常不优雅。知道前一阵，我才发现，我要找到的东西其实就近在眼前！其实只要include就好...  
v5中模版类的代码相比于v4有了不少精简，变得更加“一般化”了。

v5中删去了Bootstrap, jQuery等库，我意识到了静态文件至少逻辑上应该位于单独的服务器，不应该和LightPHP混在一起。

一个模版就是一个普通的PHP文件，参数来自 `$this`:

    Hello <?= $this["name"];?>

显示模版：

    lpTemplate::outputFile("/path/to/template.php", ["name" => "Jybox"]);

* 缓存(键/值对储存)

我是从Asp.Net过来的，很喜欢Application类提供的全局键值对储存，但PHP是并发模型的，没有全局的管理器，语言本身没办法实现这种功能，于是我先后调研了使用文件, MySQL, Memcache, APC来实现。  
在之前的版本中，一直都有这个功能(虽然Bug成堆), 但v5现在却没有，原因是还没来得及写，我愈发觉得这个功能可能并没有那么重要，大概要等到站点规模大到需要缓存的时候才会用到吧。

* 登录状态验证

在v4中，我用接口的方式实现了两套验证组件，分别是经典验证和会话式验证，应该说虽然没实现当初设想的全部功能，但它们工作的还不错。

* 配置文件管理

在v3和v4中LightPHP都没有用于管理配置文件的类，只需定义一个数组，然后在程序启动的时候include一下就好了。  
但是当RootPanel需要4个配置文件(虽然后来精简到了3个), 我发现我需要这么一个玩意了。

编写这么一个单独的类我也是为了去掉全局变量，因为在函数中使用全局变量，还要很麻烦地用gloabl声明一下。

* 调试

v5中我引入了一个自己编写的错误处理器，可以在脚本出错时打印一些有用的调试信息。  
同时我还正在编写一个有用的调试日志系统。

关于错误报告可以参见这篇文章：http://jyprince.me/program/1079

* 构造器

构造器的概念来自于设计模式中的所谓单例模式，在一个PHP脚本中，很多对象需要使用多次，每次都构造新的对象是很浪费的，但如果不使用全局变量又很难实现代码的多个部分共享一个对象。  
构造器以“注册——获取”的功能解决了这个问题，在程序开始时，程序向构造器注册用于构造各种对象的函数，但只有当程序需要获取这个对象时，这个函数才会真正地被执行，而且构造一次后，再反复获取，获取到的都是第一次构造的对象的引用。  
使用构造器统一构造对象，也省去了接口，LightPHP的类型检查本来就不严格。

    // 注册一个构造器
    lpFactory::register("lpLocale", function() {
        $path = rpROOT . "/locale";
        return new lpLocale($path, lpLocale::judegeLanguage($path, c("DefaultLanguage")));
    });

    // 获取一个对象
    $rpL = lpFactory::get("lpLocale");

目前该构造器存在一个问题就是无法获得IDE的类型提示，不过目前部分IDE正在着手开发针对于这类构造器的类型提示API.

* 国际化

v5首次加入了国际化支持，目前使用的是一种非常简单的，基于数组的专有翻译文件格式，我正在设法改进。

* 路由和分发器

路由在v4的基础上仅做了一丁点优化。

例如请求URL是 `/user/show/jybox`  
那么默认将会创建user类的一个实例, 以jybox为参数, 调用它的show函数。  
当然，这个过程中会对类名做一些修饰，这些都是可控的，你可以编写自己的分发器。

* 工具

v5包含了更多工具组件：分页，锁，Smtp等。

* 插件

在v4设计之处我就设法加入插件系统，但我查阅了一些项目的设计之后发现，除了在代码中加入大量的hook, 似乎没啥有效的办法了，不喜欢这种简单粗暴的方式。

* 短函数名

之前看ThinkPHP, 看它用了很多一个字母的短函数名，感觉很不优雅，但现在为了折中代码长度，我也不得不定义了四个短函数名。

    c() - 配置文件选项
    d() - 数据库连接
    f() - 构造器
    l() - 本地化翻译

----

LightPHP到底是个啥定位呢，除了README中(https://github.com/jybox/LightPHP/blob/master/README.md)写的那些精神上的东西。

LightPHP是我逐渐摸索出来的，后期参考了一些其他框架，抽取了他们最核心，最基本的功能。  
换句话说，我用20%的代码，实现了他们80%的功能，至于另外比较难实现的20%, 我干脆不要了~

我对LightPHP的定位是一个库，并非框架，这一点可以体现在LightPHP对全局命名空间几乎没有污染，LightPHP的各个部分也比较松散，可以单独使用。  
LightPHP也从未规定应用的文件如何组织，没对应用的代码做什么假设。
