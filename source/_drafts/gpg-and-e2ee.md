---
title: GPG 与端到端加密：论什么才是可以信任的
tags:
  - GPG
permalink: gpg-and-e2ee
date: 2016-12-01
---

首先我在这里假设读者对 RSA 和公钥加密算法有着基本的了解，那么提到 GPG 不得不提的就是公钥加密算法，首先我们先来快速地了解一下 RSA：在 RSA 中有「公钥」和「私玥」两种密钥，其中私钥可以导出公钥，但公钥无法反推私钥。如果用公钥加密数据的话，那么只有私钥可以解密；如果使用私钥签名数据的话，那么可以验签名。

![public-key-encryption](https://cdn.ziting.wang/gpg-and-e2ee/public-key-encryption.gif)

## 密码学账户

顾名思义，通常我们会将公钥公开地发布，作为自己身份的代表，就好像你的名字一样，而将私钥秘密地保存，作为身份的证明，就像密码一样。如果一个账户是由一个公钥加密算法的密钥对所保护的，那我们称之为「密码学账户」，我们身边常见的密码学账户包括：

* SSL 证书（用于 HTTPS 等加密通讯）
* S/MIME 证书（用于邮件加密和认证）
* SSH 密钥（用于登录服务器的凭证）
* Bitcoin 钱包
* GPG ID

这些账户和我们通常注册的互联网服务很不一样，在我们通常注册的互联网服务中，你的账户实际上是由服务的提供者管理的，你为账户设置的密码并没有真的用来加密数据，而只是一种证明用户所有权的凭证，在每次登录时你向服务的提供者发送密码，来证明自己是账户的所有者。一旦你忘记了密码，服务的提供者在通过其他渠道（邮箱地址、手机号码）确认了你的身份之后，也可以帮助你重置密码。

而在密码学账户中，你拥有账户的唯一凭证就是你的密钥对 —— 通常是计算机上的一个文件，你通过使用这个密钥对进行签名来管理你的账户、进行解密来访问机密数据。密码学账户既是更加安全的（没有其他任何人可以控制你的账户），同时也是更加危险的（一旦丢失也没有任何人可以帮你找回你的帐号）。

## 公钥交换

公钥加密算法看上去很美好，一旦我们有了对方的公钥，只需在通讯时用对方的公钥加密数据，就万无一失了，但其实这其中 **最薄弱的一个点就是「得到对方的公钥」，即「公钥交换」**。

![exchange](https://cdn.ziting.wang/gpg-and-e2ee/exchange.png)

上图是理想的情况，A 和 B 互相之间交换公钥，后续的通讯就可以以加密的方式进行了。但如果这时出现了一个能够监听和篡改 A 和 B 之间的通讯的 C，然后将自己的公钥发给 A 和 B，就变成了这样：

![mitm](https://cdn.ziting.wang/gpg-and-e2ee/mitm.png)

A 和 B 都以为自己得到了对方的公钥，但实际上他们得到的都是中间人 C 的公钥，这意味着他们之后的通讯都会以 C 的公钥来加密，C 便可以在中间继续进行窃听和篡改。

所以在理论上不可能有一种在线的、可靠的、不事先协商的公钥交换算法，因为交换公钥意味着双方还没有开始加密通讯，交换的过程自然没有保障。那么在实际应用中我们是如何解决公钥交换的问题的呢，我们来看一下 SSL 所使用的 X.509 证书体系是如何解决这个问题的：

![x509](https://cdn.ziting.wang/gpg-and-e2ee/x509.png)

在 X.509 中有一个被称为「证书颁发机构（CA）」的权威的第三方，CA 的数量较为有限，资格变化也并不频繁，所有浏览器（browser）都内置了 CA 的公钥。而网站方（website）在生成了自己的公钥后，需要先找 CA 对自己的公钥进行签名然后才能使用。当浏览器访问一个新的网站时，网站方需要提供经过 CA 签名的公钥，浏览器使用内置的 CA 公钥来验证签名，确保收到的网站的公钥没有被篡改过。

X.509 实际上就是要求大家信任一个权威的第三方并将它们的公钥内置在客户端中，这并不是一个完美的方案，因为在这个体系中 CA 有着非常大的权力，一旦 CA 不按照规则签发证书，那么客户端是无法察觉这种攻击行为的。

## GPG

> GPG 是 PGP（Pretty Good Privacy）的一个 GPL 实现，也是目前使用最广泛的实现。

「信任一个权威的第三方」对于一些去中心化爱好者是无法接受的，首先我们凭什么去信任这个第三方，其次在 CA 申领证书通常也是需要付费的。那么有没有可能去除这个权威的第三方，而允许大家互相进行认证呢？如何确认一个公钥就是属于这个人的呢？这就是我们接下来要介绍的 GPG 的信任模型：

![gpg-trust-model](https://cdn.ziting.wang/gpg-and-e2ee/gpg-trust-model.png)

在 GPG 的信任模型中，用户互相之间对公钥进行签名，例如 Alice 和 Bob 是很好的朋友，要么 Alice 就会用自己私玥给 Bob 的公钥签名，然后将这个签名通过 Key Server 广播给其他人。Key Server 仅仅用来交换公钥和签名，因为签名本身是可校验的，所以 Key Server 并没有任何特权。

当另外一个 Alice 的朋友看到 Bob 的公钥，并且发现 Alice 给 Bob 的公钥签过名，那么就可以认为他的朋友 Alice 已经检查过 Bob 的公钥了，如果看到更多朋友给 Bob 签过名，那么就可以认为 Bob 的身份是真实的。

所以 GPG 实际上是一个由「熟人关系」建立起的信任网络，当你认可一个人的身份，即认可这个公钥是属于这个人的，你便可以给他的公钥进行签名，形成一种信任关系，同时这种信任关系又是可以传递的。当你的 GPG 通讯录中有了一些互相信任的朋友之后，便可基于这个关系网来拓展你的朋友圈。

那么既然我们提到不可能有一个在线的、可靠的、不事先协商的公钥交换算法，那么这个信任网络在一开始是如何建立起来的呢？答案是使用分散的、多渠道的、可能是线下的方式来交换和确认公钥。如果使用一个固定的协议去交换公钥，而且这个协议本身没有加密保护，那么当然容易被中间人攻击，但如果两个人同时使用多种渠道来交换公钥，例如先用邮件发一次、再用微信发一次、最后再用电话说一次，那么这些渠道同时被攻击的可能性会非常小。

或者更进一步，我们可以采用线下的方式来进行确认，实际上很多技术类会议结束后可能会有一个 Key Signing Party 的活动，大家面对面地确认身份（你可能有必要出示印有照片的证件，例如身份证或护照），用纸和笔记下公钥，然后回家进行签名和上传。

![key-signing-party](https://cdn.ziting.wang/gpg-and-e2ee/key-signing-party.jpg)

最后你便得到了一些来自其他人签名，代表他们认可了你的身份，即认可了 E466CF1E 这个公钥属于我（王子亭），也即 jysperm@gmail.com 这个邮件地址的主人。

## GPG 通讯簿

因为 GPG 需要用户自己维护信任关系，因此每个 GPG 的用户都会有一个通讯簿，里面是大量的公钥（代表着一个其他用户）和签名（代表着信任关系）。

下面是我的通讯录中与我自己相关的部分：

```
$ gpg --list-keys jysperm
pub   4096R/E466CF1E 2014-11-23 [expires: 2017-05-17]
uid       [ultimate] Wang Ziting <jysperm@gmail.com>
uid       [ultimate] Wang Ziting <jysperm@icloud.com>
uid       [ultimate] [jpeg image of size 1476]
sub   2048R/1D795875 2014-11-23 [expires: 2017-05-17]
sub   2048R/289286B3 2014-11-23 [expires: 2017-05-17]
sub   2048R/35B5DE4D 2016-05-17 [expires: 2017-05-17]
```

其中 `E466CF1E` 是我的「根公钥」的简写形式，`4096R` 表示这是一个 4096 bit 的 RSA 密钥对，创建时间是 `2014-11-23`，有效期至 `2017-05-17`。我可以使用根公钥签署类似于「jysperm@gmail.com 是我的邮箱地址」的签名，来声明自己的身份，即我的两个邮箱地址和一个头像图片。

我还可以使用根公钥签署一个类似于「我授权 1D795875 为我的子密钥，可以代替我进行签名等操作」的消息来添加额外的子密钥。

还可以列出与我有关的签名：

```
$ gpg --list-sigs jysperm
pub   4096R/E466CF1E 2014-11-23 [expires: 2017-05-17]
uid                  Wang Ziting <jysperm@gmail.com>
sig          C07CFB96 2016-05-04  paomian <qtang@leancloud.rocks>
sig 3        7CDC82A7 2015-05-11  Yeechan Lu <wz.bluesnow@gmail.com>
sig 3        E466CF1E 2016-05-17  Wang Ziting <jysperm@gmail.com>
sig          E411E711 2016-06-02  keybase.io/librazy <librazy@keybase.io>
sig          B0B002B8 2016-07-13  dennis (Dennis Zhuang) <killme2008@gmail.com>
```

这里看到除了我自己之外，还有其他四个人为我 `jysperm@gmail.com` 这个 uid 进行了签名，认可了 `E466CF1E` 这个公钥属于 `Wang Ziting <jysperm@gmail.com>` 这个人。

## 使用 GPG

前面我们介绍了 GPG 的信任模型和通讯簿，那么可以在哪些场景下使用 GPG 呢？

首先是你可以用它签名一段消息：

```
> echo 'hello' | gpg --clearsign -a
-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA1

hello
-----BEGIN PGP SIGNATURE-----

iQIcBAEBAgAGBQJXfifAAAoJELQPOvDkZs8epZAP/3/jP6k1Dev2a8i8KfY7VDfv
TVGl61kLEbgpgR3mWXFL7PaJ8SyW8N0Dv3cJhYbY8NGp8wbkZa7cUS7DkTb2ArhS
M+IKUJtwUwbfp5fOyT+esaDLWatqjSJ+5IjWX8BOnh5SnLNMURDxsYrJMShfecTD
tbBfnEkIeCFBwIfE0Xs5m23+6i7t77ZgLdn1qpWLTRNpd6Fzi0B653Kr8dREPflI
MAsn6CP90pX55V0LnsZGiAgZV+34iFolhFDd7N5mtPT/zF7OToN2SNJF3YOVikBp
M+1WJL9W8x9DwzhOq8AmPgHIEwBZVNS8Nv+UNadIZJuexR0ERl64e8MdTLft0Qui
ChjUiD7ibkLR433jcms+2EJ04xd6Ie0mp/nH5nMLY1mEgHtLMXql6VHQCbJt80Vf
ZrL2J+BF9Sk1zPh9Hn5NGe+RLX1d/CZ62rYMICRcEwiS9vpWq6m9ouSMNZUYr8S5
a/ooD6gc71t457pVgkMqjo3Auazf4PRilUsAraQZilr+8yPhciE/PX3gBL5CtKHJ
4vKH9P9RngigL6D+YyBB5vMcpXlhx9ShbH2qLr106adJ1XrCpGtSmfxygjRn3xX9
Q1dWUaELUahhcdtK6IwZ6qzyp9AESpSd+Z/bnV7jc8iC0VtMOXipVnMo7J5qyHKD
/+yt8/tzoC4+0MEzlaHJ
=aOto
-----END PGP SIGNATURE-----
```

上面我们用 SHA1 这个算法给 `hello` 这个字符串做了签名。

例如最近 GitHub 支持了为帐号配置 GPG 公钥的身份，然后你可以在发布新版本的时候用 `git tag -s v1.0.0` 进行签名，防止伪造 Commit:

![github-gpg-signature](https://cdn.ziting.wang/gpg-and-e2ee/github-gpg-signature.png)

你可以在本地这样来验证签名：

```
$ git tag -v v1.1.0
object b0e42636df7394ac34f2b61c589233d0c3296d10
type commit
tag v1.1.0
tagger jysperm <jysperm@gmail.com> 1467084786 +0800

Release 1.1.0
gpg: Signature made 二  6/28 11:33:17 2016 CST
gpg:                using RSA key B40F3AF0E466CF1E
gpg: Good signature from "Wang Ziting <jysperm@gmail.com>" [ultimate]
gpg:                 aka "keybase.io/jysperm <jysperm@keybase.io>" [ultimate]
gpg:                 aka "Wang Ziting <jysperm@icloud.com>" [ultimate]
gpg:                 aka "Wang Ziting <jysperm@outlook.com>" [ultimate]
gpg:                 aka "Wang Ziting <jysperm@fastmail.com>" [ultimate]
gpg:                 aka "[jpeg image of size 1476]" [ultimate]
```

很多开源软件在发布新版本的二进制包时也会进行签名：

```
-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

5c711a62e464f1d455c31afe2a62e9866eeaf1c23d977b57a60285d0bd040ba5  node-v6.3.0-darwin-x64.tar.gz
4f9a19b5688092d5652e8748093cb9c90fa503ea13b976e51dbd53c2fa07c116  node-v6.3.0-darwin-x64.tar.xz
9275894c3ed6373068cddeeb968e4d2ceba76368b6cd3b01aca79f0b592badd6  node-v6.3.0-headers.tar.gz
85358983586760b0a9c0d36294ca5266dbd4e5d0df5390dfbf7aba684799e8db  node-v6.3.0-headers.tar.xz
58995c3f91962fc4383696f9c64763b3cd27d9b5903b4cf2a5ccfe86c8258e9f  node-v6.3.0-linux-arm64.tar.gz
18000ebe5208a2ddb17ab6d301a79d6ffa29287d579299480c62859c42c6c51c  node-v6.3.0-linux-arm64.tar.xz
de3554545e2d04719ebcd990984ff1eb5d6edbbbb9d24893cb998e2eb15d8bf5  node-v6.3.0-linux-armv7l.tar.gz
dce3e835d17a4febfb234f37593eb1b1dc02c87c16f49504c1800de7a8ccb0f2  node-v6.3.0-linux-armv7l.tar.xz
-----BEGIN PGP SIGNATURE-----
Comment: GPGTools - https://gpgtools.org

iQIcBAEBCgAGBQJXfUO5AAoJEEX17r2BPa6Ob0cQAIsV4/DC/961LkhIV2RJUXUO
YhFC6nchaTM3MSr3RQvDQQNC3TmEt9JagPPyMC1oMiy9DT7rzq52UCquIMh6nS8j
NjBs+L55Y0BaXrQbuqGs+isiqqUVvuLZkLU9IBbKs8hID4egqrHyY7tkxidoO3kL
g+z/A43rcSOPZzrGl6muwIe9OF/81o1sJHTETfn939SXfM9zOXQmbo71EfUnVNHT
ZfEIk4o4v24SR7+OW444ziJpJY4robJcFnUlA0WvBkf34ByAKIWnXm5yEEaNIIHa
R3E84JrXM0HgDfCVQ089pAyY1ImLT4XosK3j1pmjND/nOHHblH/TfcF73pBqtC70
n3eXjilVaTzZeMnRFHi5Ofopc9VPgAhAd/+Ya1aVDzUb0IA5mR3uMR8KTYx1UDZN
5yuBpHLhj4TFYmjHVvPRsJ4VT7qSUtHZXzHJyEG+mqhjJQtjkbF81fHbO0NYzr3G
uY0iUdc+cKmGuWq059qFJFo/6mlPdIlIydCIs31peVwRpI4JuXapGuVwRvlyD/kH
cFmElIXdq7S+Kn9jxIaokx2bo1hoZ1Q8Tb74s0kxhh+1bUlQohuUScvS3h1PG7cM
nn8OdMAVg9tNs2YrCndYzWqup80l+23boLTX9qyxEWeQo2Nb9Ddja2oZXERLy4hT
+v4vjY1hcMdVt/eL5tZ+
=DrfW
-----END PGP SIGNATURE-----
```

包括 Debian 的软件仓库 apt 也是通过 GPG 进行签名的。

然后你当然也可以用 GPG 加密消息：

```
$ echo 'hello' | gpg --encrypt -a -r jysperm
-----BEGIN PGP MESSAGE-----

hQEMAyp325QokoazAQf8DDqELYisLFSGo/9Gblr1MEabb9t3V3AcbWkA4uimpYeD
/DTWDlmxrIsvpmDDeV/1bAZ/gMc2DzhODfM4PQf8DfD+lvHwgMBhe1zSBCZlQwkj
xkP+CtF+S8xWTciaexIMQiTHLNu1tvhvCjIeR1qYJY0/E7tdKhS5iG4Jc3/oyCNN
a1m34O9GG5WJsHozGqpfKZFma50onDmQ6TnSuz4iDWrslvq3XuLRXvgOQ6DKArix
Sxnmxg1kMvlIF6AMmQRHaHpyXBoOlaX/NEsl8ESCe9w4KZFTCoFtsEB9tAwQGeGn
6Tnd7BLaxXOabqaSpoNcOlpWDlZcX89lbewAryKbY9I7AbURsuemI37bTizQUjWA
57xm4t7wTUJ/FLx22Amv1ljUa/Rq84rO8d38EQViNGyo31UmRVXy12AmBDU=
=T42S
-----END PGP MESSAGE-----
```

这里我们指定了我自己的公钥为收信人，可以看到不同于前面，加密消息没有明文部分，除非使用收信人的私玥，否则无法解密。

解密消息：

```
jysperm@jysperm-MacBook-Pro ~> gpg -d
-----BEGIN PGP MESSAGE-----

hQEMAyp325QokoazAQf/RZACIGHK8dsgfwchf06/plemSlVHdYOmY4ipBuPDvui2
x/4HV15HC6i4qK4TkGF61lWElIj0BHikdREtPrqI2t4hsiRPZjVlX9Vic2BHLOnT
PErzRs5xUZcE5WQOFU4XmAqHhGwfmgw1SmS1N0411Hx2FakHgqI5kPvEePP1lkLT
o35tzJvnuuP5GXkLVhHAfHtMq0jDPSQEpvkn/k2tZeFgtI4mhwQrq1+dAGKStPIB
ptc2kTced1/pa8Jc7jAzdNY5oboluWq2rxyKXyLX0hsDfBt66c5a3v0X2mXR1kaW
l7V2Pw069+MMhqeTNq6hu9BXTWA6meWyUoGzSXp3KtI7AWj78aw6gajo1X7QMlcI
2vUGuh5CymMNrAHYNH95v31MU6lOJtArxiMTlDL58R5vwf7K9yTy2zXevbM=
=bZ2W
-----END PGP MESSAGE——
gpg: 由 2048 位的 RSA 密钥加密，钥匙号为 289286B3、生成于 2014-11-23
      “Wang Ziting <jysperm@gmail.com>”
hello
```

有一个比较有趣的实践是你可以用 gpg 来加密你的密码，`pass` 是一个基于 GPG 和 Git 的非常简单的密码管理器，你可以用 GPG 来加密密码然后用 Git 来管理版本：

```
jysperm@jysperm-MacBook-Pro ~> pass find Coding
Search Terms: Coding
└── Code
    └── Coding
        └── jysperm.gpg

jysperm@jysperm-MacBook-Pro ~> pass insert Code/Coding/jysperm

jysperm@jysperm-MacBook-Pro ~> pass show Code/Coding/jysperm
DzizKKVIy22aHQwm

jysperm@jysperm-MacBook-Pro ~> pass git pull --rebase
remote: Counting objects: 11, done.
remote: Total 11 (delta 1), reused 1 (delta 1), pack-reused 10
Unpacking objects: 100% (11/11), done.
From github.com:jysperm/passwords
   5026f34..e94a70f  master     -> origin/master
First, rewinding head to replay your work on top of it...
Fast-forwarded master to e94a70f8b42af5e1c13dd69246b156bbcb24a94c.
```

这样一来你甚至可以把密码托管在 GitHub 上：

![passwords](https://cdn.ziting.wang/gpg-and-e2ee/passwords.png)

- <https://dusted.codes/the-beauty-of-asymmetric-encryption-rsa-crash-course-for-developers>
- [The Keysigning Party HOWTO](http://www.cryptnet.net/fdp/crypto/keysigning_party/en/keysigning_party.html)（[繁体中文](https://web.archive.org/web/20070210014944/http://www.cryptnet.net/fdp/crypto/gpg-party/gpg-party.zh-TW.html.euc-tw)）
