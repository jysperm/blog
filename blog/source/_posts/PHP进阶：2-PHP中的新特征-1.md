title: PHP进阶：2.PHP中的新特征(1)
tags:
  - 技术
  - PHP
  - PHP进阶
  - 教程
date: 2013-05-21 22:23:33
---

# 2.0 PHP 中的新特征

截至目前(2013.5), PHP 的最新稳定版本是 PHP5.4, 但有差不多一半的用户仍在使用已经不在维护[1]的 PHP5.2, 其余的一半用户在使用 PHP5.3[2].

因为 PHP 那“集百家之长”的蛋疼语法，加上社区氛围不好，很多人对新版本，新特征并无兴趣。

本章将会介绍自 PHP5.2 起，直至 PHP5.5 中增加的新特征，本书后文若不加说明，默认基于目前的最新稳定版本 PHP5.4.

[1]: 已于2011年1月停止支持： http://www.php.net/eol.php

## PHP5.2以前

(    -2006)

顺便介绍一下 PHP5.2 已经出现但不常用的特征。

## autoload

大家可能都知道 __autoload() 函数，如果定义了该函数，那么当在代码中使用一个未定义的类的时候，该函数就会被调用，你可以在该函数中加载相应的类实现文件，如：

    function __autoload($classname)
    {
        require_once("{$classname}.php")
    }
    `</pre>

    但该函数已经不被建议使用，原因是一个项目中仅能有一个这样的 __autoload() 函数，因为 PHP 不允许函数重名。但当你使用一些类库的时候，难免会出现多个 autoload 函数的需要，于是 spl_autoload_register() 取而代之：

    <pre>`spl_autoload_register(function($classname)
    {
        require_once("{$classname}.php")
    });
    `</pre>

    spl_autoload_register() 会将一个函数注册到 autoload 函数列表中，当出现未定义的类的时候，SPL[3] 会按照注册的倒序逐个调用被注册的 autoload 函数，这意味着你可以使用 spl_autoload_register() 注册多个 autoload 函数.

    [3]: Standard PHP Library, 标准 PHP 库, 被设计用来解决一些经典问题(如数据结构).

    ## PDO 和 MySQLi

    即 PHP Data Object, PHP 数据对象，这是 PHP 的新式数据库访问接口。

    按照传统的风格，访问 MySQL 数据库应该是这样子：

    <pre>`// 连接到服务器，选择数据库
    $conn = mysql_connect("localhost", "user", "password");
    mysql_select_db("database");

    // 执行 SQL 查询
    $type = $_POST['type'];
    $sql = "SELECT * FROM `table` WHERE `type` = {$type}";
    $result = mysql_query($sql);

    // 打印结果
    while($row = mysql_fetch_array($result, MYSQL_ASSOC))
    {
        foreach($row as $k =&gt; $v)
            print "{$k}: {$v}\n";
    }

    // 释放结果集，关闭连接
    mysql_free_result($result);
    mysql_close($conn);
    `</pre>

    为了能够让代码实现数据库无关，即一段代码同时适用于多种数据库(例如以上代码仅仅适用于MySQL)，PHP 官方设计了 PDO.

    除此之外，PDO 还提供了更多功能，比如：

*   面向对象风格的接口
*   SQL预编译(prepare), 占位符语法
*   更高的执行效率，作为官方推荐，有特别的性能优化
*   支持大部分SQL数据库，更换数据库无需改动代码

    上面的代码用 PDO 实现将会是这样：

    <pre>`// 连接到数据库
    $conn = new PDO("mysql:host=localhost;dbname=database", "user", "password");

    // 预编译SQL, 绑定参数
    $query = $conn-&gt;prepare("SELECT * FROM `table` WHERE `type` = :type");
    $query-&gt;bindParam("type", $_POST['type']);

    // 执行查询并打印结果
    foreach($query-&gt;execute() as $row)
    {
        foreach($row as $k =&gt; $v)
            print "{$k}: {$v}\n";
    }
    `</pre>

    PDO 是官方推荐的，更为通用的数据库访问方式，如果你没有特殊需求，那么你最好学习和使用 PDO.

    但如果你需要使用 MySQL 所特有的高级功能，那么你可能需要尝试一下 MySQLi, 因为 PDO 为了能够同时在多种数据库上使用，不会包含那些 MySQL 独有的功能。

    MySQLi 是 MySQL 的增强接口，同时提供面向过程和面向对象接口，也是目前推荐的 MySQL 驱动，旧的C风格 MySQL 接口将会在今后被默认关闭。

    MySQLi 的用法和以上两段代码相比，没有太多新概念，在此不再给出示例，可以参见 PHP 官网文档[4]。

    ## PHP5.2

    (2006-2011)

    ### JSON 支持

    包括 json_encode(), json_decode() 等函数，JSON 算是在 Web 领域非常常用的数据交换格式，可以被 JS 直接支持，JSON 实际上是 JS 语法的一部分。

    JSON 系列函数，可以将 PHP 中的数组结构与 JSON 字符串进行转换：

    <pre>`$array = ["key" =&gt; "value", "array" =&gt; [1, 2, 3, 4]];
    $json = json_encode($array);
    echo "{$json}\n";

    $object = json_decode($json);
    print_r($object);
    `</pre>

    输出：

    <pre>`{"key":"value","array":[1,2,3,4]}
    stdClass Object
    (
        [key] =&gt; value
        [array] =&gt; Array
            (
                [0] =&gt; 1
                [1] =&gt; 2
                [2] =&gt; 3
                [3] =&gt; 4
            )
    )
    `</pre>

    值得注意的是 json_decode() 默认会返回一个对象而非数组，如果需要返回数组需要将第二个参数设置为 true.

    ## PHP5.3

    (2009-2012)

    PHP5.3 算是一个非常大的更新，新增了大量新特征，同时也做了一些不向下兼容的修改。

    ### 弃用的功能

    以下几个功能被弃用，若在配置文件中启用，则 PHP 会在运行时发出警告。

*   register_globals
*   magic_quotes_gpc
*   safe_mode

    弃用的原因和解决方案已在第一章说明过[5], 在此不再复述。

    ### 匿名函数

    也叫闭包(Closures), 经常被用来临时性地创建一个无名函数，用于回调函数等用途。

    <pre>`$func = function($arg)
    {
        print $arg;
    };

    $func("Hello World");
    `</pre>

    以上代码定义了一个匿名函数，并赋值给了 $func.

    可以看到定义匿名函数依旧使用 function 关键字，只不过省略了函数名，直接是参数列表。

    然后我们又调用了 $func 所储存的匿名函数。

    匿名函数还可以用 use 关键字来捕捉外部变量：

    <pre>`function arrayPlus($array, $num)
    {
        array_walk($array, function(&amp;$v) use($num){
            $v += $num;
        });
    }
    `</pre>

    上面的代码定义了一个 arrayPlus() 函数(这不是匿名函数), 它会将一个数组($array)中的每一项，加上一个指定的数字($num).

    在 arrayPlus() 的实现中，我们使用了 array_walk() 函数，它会为一个数组的每一项执行一个回调函数，即我们定义的匿名函数。

    在匿名函数的参数列表后，我们用 use 关键字将匿名函数外的 $num 捕捉到了函数内，以便知道到底应该加上多少。

    ### 魔术方法：__invoke(), __callStatic()

    PHP 的面向对象体系中，提供了若干“模式方法”，用于实现类似其他语言中的“重载”，如在访问不存在的属性、方法时触发某个魔术方法。

    随着匿名函数的加入，PHP 引入了一个新的魔术方法 __invoke().

    该魔术方法会在将一个对象作为函数调用时被调用：

    <pre>`class A
    {
        public function __invoke($str)
        {
            print "A::__invoke(): {$str}";
        }
    }

    $a = new A;
    $a("Hello World");
    `</pre>

    输出毫无疑问是：

    <pre>`A::__invoke(): Hello World
    `</pre>

    __callStatic() 则会在调用一个不存在的静态方法时被调用。

    ### 命名空间

    PHP的命名空间有着前无古人后无来者的无比蛋疼的语法：

    <pre>`&lt;?php
    // 命名空间的分隔符是反斜杠，该声明语句必须在文件第一行。
    // 命名空间中可以包含任意代码，但只有 **类, 函数, 常量** 受命名空间影响。
    namespace XXOO\Test;

    // 该类的完整限定名是 \XXOO\Test\A , 其中第一个反斜杠表示全局命名空间。
    class A{}

    // 你还可以在已经文件中定义第二个命名空间，接下来的代码将都位于 \Other\Test2 .
    namespace Other\Test2;

    // 实例化来自其他命名空间的对象：
    $a = new \XXOO\Test\A;
    class B{}

    // 你还可以用花括号定义第三个命名空间
    namespace Other {
        // 实例化来自子命名空间的对象：
        $b = new Test2\B;

        // 导入来自其他命名空间的名称，并重命名，
        // 注意只能导入类，不能用于函数和常量。
        use \XXOO\Test\A as ClassA
    }
    `</pre>

    更多有关命名空间的语法介绍请参见官网[4].

    命名空间时常和 autoload 一同使用，用于自动加载类实现文件：

    <pre>`spl_autoload_register(
        function ($class) {
            spl_autoload(str_replace("\\", "/", $class));
        }
    );

当你实例化一个类 \XXOO\Test\A 的时候，这个类的完整限定名会被传递给 autoload 函数，autoload 函数将类名中的命名空间分隔符(反斜杠)替换为斜杠，并包含对应文件。

这样可以实现类定义文件分级储存，按需自动加载。