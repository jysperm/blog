---
title: 我的 NAS 选型与搭建过程（基于开源方案）
alias: my-opensource-nas-build
tags:
  - NAS
  - Linux
date: 2020-11-04
---

在 2016 年我拥有了第一台 NAS —— 群晖的 DS215J，其实在之后的很长一段时间其实并没有派上多大用场，因为我的数据并不多，大都存储在云端，更多的是体验一下 NAS 的功能和工作流。

直到最近我才开始真正地将 NAS 利用上，于是准备升级一下，但考虑到群晖的性价比实在太低，再加上去年配置 Linux 软路由让我对基于「原生 Linux」的开源解决方案信心和兴趣大增，于是准备自己 DIY 一台 NAS，计划解决未来十年的存储需求。

我依然选择了我最熟悉的 Ubuntu 作为操作系统、Ansible 作为配置管理工具，因此这个 NAS 的大部分配置都可以在我的 [GitHub](https://github.com/jysperm/playbooks/tree/master/roles) 上找到。

> 注意这个仓库中的 Ansible 配置仅供参考，不建议直接运行，因为我在编写这些配置时并未充分考虑兼容性和可移植性。

## 文件系统
对于一台 NAS 来说最重要的当然是文件系统，不需要太多调研就可以找到 [ZFS](https://openzfs.github.io/openzfs-docs/index.html) —— 可能是目前在数据可靠性上下功夫最多的单机文件系统了，于是我的整个选型就围绕 ZFS 展开了。

ZFS 既是文件系统，同时又是阵列（RAID）管理器，这为它带来了一些其他文件系统难以提供的能力：

- ZFS 为每个块都存储了校验和，同时会定期扫描整个硬盘，从 RAID 中的其他硬盘修复意外损坏的数据（如宇宙射线导致的比特翻转）。
- 在 RAID 的基础上可以 [指定某些目录以更多的份数冗余存储](https://docs.oracle.com/cd/E19253-01/819-5461/gevpg/index.html)，对于重要的数据即使损坏的硬盘超过了 RAID 方案的限制，依然有可能找回。

ZFS 还支持数据加密、压缩和去重，这三项功能以一种巧妙的顺序工作，并不会互相冲突，同时这些所有选项都可以设置在目录（dataset）级别、可以随时更改（只对新数据生效）。

ZFS 当然也支持快照，快照可以被导出为二进制流，被存储到任何地方。这个功能可以让你在不丢失任何元信息的情况下对 ZFS 的文件系统进行备份、传输和恢复。

## 硬件
我并不擅长淘硬件，于是就选择了 HPE 的 MicroServer Gen10，一个四盘位的成品微型服务器，CPU 是 AMD X3421 ，8G ECC 内存，也是标准的 x86 通用硬件，应该不太容易遇到坑。

![](https://r2-lc-cn.jysperm.me/pictures/2020/nas-gen-10.png)

我用转接卡在 PCI-E 插槽上装了一块 NVME SSD，用作系统盘和 ZFS 的读缓存（L2ARC，不过从后面的统计来看效果并不明显），数据盘则暂时用的是旧的硬盘，最终会升级到四块 4T 的硬盘。这里需要注意的是因为 ZFS 不支持更改 RAID 的结构，所以必须在一开始就配置足够的硬盘来占位，后续再升级容量，我甚至用 USB 接了一块移动硬盘来凑数。

## ZFS
因为是四盘位，所以我采用了 raidz1（RAID5），冗余一块盘作为校验，如果最终所有的盘都升级到 4T，一共是 12T 的实际可用容量。

```txt
root@infinity:~# zpool status
  pool: storage
 state: ONLINE
config:
    NAME                                 STATE     READ WRITE CKSUM
    storage                              ONLINE       0     0     0
      raidz1-0                           ONLINE       0     0     0
        sda                              ONLINE       0     0     0
        sdb                              ONLINE       0     0     0
        sdc                              ONLINE       0     0     0
        sdd                              ONLINE       0     0     0
    cache
      nvme0n1p4                          ONLINE       0     0     0

root@infinity:~# zpool list
NAME      SIZE  ALLOC   FREE  CKPOINT   FRAG    CAP  DEDUP    HEALTH
storage  7.27T  3.52T  3.75T        -    10%    48%  1.00x    ONLINE
```

> 通常认为 RAID5 在出现硬盘故障的恢复过程中存在着较高的风险发生第二块盘故障、最终丢失数据的的情况；或者硬盘上的数据随着时间推移发生比特翻转导致数据损坏。但考虑到 ZFS 会定期做数据校验来保证数据的正确性，再综合考虑盘位数量和容量，我认为这个风险还是可以接受的，后面也会提到还有异地备份作为兜底措施。

我开启了 ZFS 的加密功能，但这带来了一个问题：我不能把密钥以明文的方式存储在 NAS 的系统盘 —— 否则密钥和密文放在一起的话，这个加密就失去意义了。所以每次 NAS 重启后，都需要我亲自输入密码、挂载 ZFS 的 dataset，然后再启动其他依赖存储池的服务。

我还开启了 ZFS 的数据压缩，默认的 lz4 只会占用少量的 CPU 却可以在一些情况下提高 IO 性能 —— 因为需要读取的数据量变少了。因为去重对资源的需求较高，相当于需要为整个硬盘建立一个索引来找到重复的块，我并没有开启去重功能。

> 一些评论认为 ZFS 对内存的需求高、必须使用 ECC 内存。这其实是一种误解：更多的内存可以提升 ZFS 的性能，ECC 则可以避免系统中所有应用遇到内存错误，但这些并不是必须的，即使没有更多的内存或 ECC，ZFS 依然有着不输其他文件系统的性能和数据完整性保证。

## 存储服务

> 小知识：SMB 是目前应用得最广泛的局域网文件共享协议，在主流的操作系统中都有内建的支持。CIFS 是微软（Windows）对 SMB 的一个实现，而我们会用到的 Samba 是另一个实现了 SMB 协议的自由软件。

![](https://r2-lc-cn.jysperm.me/pictures/2020/nas-samba.png)

作为 NAS 最核心的功能就是通过 SMB 协议向外提供存储服务，所有的成品 NAS 都有丰富的选项来配置 SMB 的功能，但我们就只能直接去编辑 Samba 的配置文件了，Samba 直接采用了 Linux 的用户和文件权限机制，配置起来也不算太麻烦：

```txt
# 可以在 path 中使用占位符来为每个用户提供单独的 Home 目录
# 可以在 valid users 中使用用户组来控制可访问的用户
[Home]
path = /storage/private/homes/%U
writeable = yes
valid users = @staff

# Samba 默认以登录用户创建文件，但 NextCloud 以 www-data 运行，可以用 force user 覆盖为特定的用户
[NextCloud]
path = /storage/nextcloud/data/%U/files
writeable = yes
valid users = @staff
force user = www-data

# 通过这些设置可以让 macOS 的 TimeMachine 也通过 SMB 进行备份
# 详见 https://www.reddit.com/r/homelab/comments/83vkaz/howto_make_time_machine_backups_on_a_samba/
[TimeMachine]
path = /storage/backups/timemachines/%U
writable = yes
valid users = @staff
durable handles = yes
kernel oplocks = no
kernel share modes = no
posix locking = no
vfs objects = catia fruit streams_xattr
ea support = yes
inherit acls = yes
fruit:time machine = yes

# 对于共享的目录可以用 force group 覆盖文件的所属组、用 create mask 覆盖文件的权限位
[VideoWorks]
path = /storage/shares/VideoWorks
writeable = yes
valid users = @staff
force group = staff
create mask = 0775

# 还可以设置游客可读、指定用户组可写的公开目录
[Resources]
path = /storage/public/Resources
guest ok = yes
write list = @staff
force group = +staff
create mask = 0775
```

从上面的配置中也可以看到这些共享目录分散在几个不同的路径，为了匹配不同的数据类型、方便在目录级别进行单独设置，我划分了几个 dataset:

- `db` 存放应用的数据库文件，将 recordsize 设置为了 8k（默认 128k）。
- `nextcloud` NextCloud 的数据目录，也可被 SMB 访问。
- `private` 每个用户的个人文件。
- `shares` 家庭内部共享的文件（如拍摄的视频）。
- `public` 可以从互联网上下载到的文件，不参与异地备份。
- `backups` 备份（Time Machine 等），不参与异地备份。

```txt
root@infinity:~# zfs list
NAME                USED  AVAIL     REFER  MOUNTPOINT
storage            2.27T   286G      169K  /storage
storage/backups     793G   286G      766G  /storage/backups
storage/db          741M   286G      339M  /storage/db
storage/nextcloud   207G   286G      207G  /storage/nextcloud
storage/private    62.2G   286G     62.2G  /storage/private
storage/public      648G   286G      613G  /storage/public
storage/shares      615G   286G      609G  /storage/shares
```

## 应用
首先我安装了 [Netdata](https://github.com/netdata/netdata)，这是一个开箱即用的监控工具，在仅占用少量资源的情况下提供秒级精度的大量统计指标，非常适合用于监控单台服务器的性能瓶颈。

![](https://r2-lc-cn.jysperm.me/pictures/2020/nas-netdata.jpg)

其余的应用都被我运行在了 Docker 中（使用 docker-compose 来管理），这样可以隔离应用的运行环境，提升宿主机的稳定性，安装、升级、卸载应用也会更方便。

其中最重要的一个应用是 [NextCloud](https://nextcloud.com/)，这是一个开源的同步盘，我主要看中它的 iOS 应用和 iOS 有不错的整合，可以正确地同步 Live Photo，也可以在 iOS 的文件应用中被调用。

![](https://r2-lc-cn.jysperm.me/pictures/2020/nas-nextcloud.jpg)

NextCloud 服务端会直接读写文件系统中的文件，而不是将文件存储在数据库里，这意味着 NextCloud 的数据目录同时也可以通过 Samba 来访问，这一点非常方便（不过需要一个定时任务来刷新 NextCloud 数据库中的元信息）。

我还在 Docker 中运行了这些服务，它们都是开源的：

- [Miniflux](https://miniflux.app/)，一个 RSS 服务端，通过 Fever API 支持绝大部分的 RSS 客户端。
- [Bitwarden](https://github.com/dani-garcia/bitwarden_rs)（非官方实现），一个密码管理器，提供有各平台的客户端和浏览器插件。
- [Transmission](https://transmissionbt.com/)，一个 BitTorrent 客户端，提供基于 Web 的管理界面。

## 外部访问
如果要真正地用 NAS 来替代网盘的话，还是需要保证不在家里的内网的时候也可以访问到文件的。

通常的做法是使用 DDNS（动态 DNS）将一个域名解析至家庭宽带的 IP，这要求家庭宽带有公网 IP，而且运营商允许在 80 或 443 端口提供 Web 服务。我不想依赖这一点，所以想到了用 [frp](https://github.com/fatedier/frp) 来进行「反向代理」，如果你确实有公网 IP 的话，也可以使用 DDNS 的方案，这样会省去一个中转服务器，也可以有更好的速度。

为了让 NextCloud 能有一个固定的地址（如 `https://nextcloud.example.com`）我将域名在内外网分别进行了解析，在家时解析到内网地址，在外解析到中转服务器。无论是内外网，数据流都会经过 Let’s Encrypt 的 SSL 加密，这样就不需要中转服务器有较高的安全保证。

虽然不需要先拨一个 VPN 确实很方便，但将 NextCloud 开放在公网上 [并不安全](https://www.cvedetails.com/vulnerability-list/vendor_id-15913/Nextcloud.html)，在社区中已有用户 [要求 NextCloud 客户端支持双向 SSL 认证](https://github.com/nextcloud/ios/issues/847)，我也非常期待这个功能，可以在公网访问上提供更好的安全性。

我还在 NAS 上安装了 [WireGuard](https://www.wireguard.com/)，这是一个内建在 Linux 内核中的 VPN 模块，同样通过 frp 暴露在外网，除了 NextCloud 之外的服务，如 SMB、SSH 和 Nextdata 都可以通过 WireGuard 来访问。

如果你不执着于开源方案的话，也可以试试 [ZeroTier](https://www.zerotier.com/)，它提供了 NAT 穿透的能力，让你的设备和 NAS 之间可以不借助中转服务器直接传输，改善连接速度。

## 备份和数据完整性
在 raidz1 的基础上，我设置了定时任务让 ZFS 每天生成一个快照，还写了一个脚本来按照类似 Time Machine 的规则来清理备份：保留最近一周的每天快照、最近一个月的每周快照、最近一年的每月快照、以及每年的快照。

```text
root@infinity:~# zfs list storage/nextcloud -t snapshot
NAME                           USED  AVAIL     REFER  MOUNTPOINT
storage/nextcloud@2020-09-05  83.9M      -      182G  -
storage/nextcloud@2020-09-15  35.2M      -      207G  -
storage/nextcloud@2020-09-21  30.2M      -      207G  -
storage/nextcloud@2020-09-23  29.7M      -      207G  -
storage/nextcloud@2020-09-26  29.3M      -      207G  -
storage/nextcloud@2020-09-27  28.2M      -      207G  -
storage/nextcloud@2020-09-28  28.2M      -      207G  -
storage/nextcloud@2020-09-29  29.1M      -      207G  -
storage/nextcloud@2020-09-30  33.5M      -      207G  -
```

快照主要是为了防止人工的误操作，除了单纯的、当场就能发现的手滑之外，有时你会误以为你不会用到这个文件而将它删除，直到很久之后才发现并非如此。

同时每周会有定时任务使用 [restic](https://restic.net/) 备份一个快照到 [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) 作为异地备份，这是一个价格较低的对象存储，非常适合备份。restic 支持增量的快照备份，也支持加密。出于成本考虑，异地备份仅包括由我产生的数据，并不包括 public 和 backups 目录。

我曾考虑过直接在远端运行一个 ZFS 来进行备份，zfs send / recv 支持以二进制流的形式传输一个快照 —— 不需要远端安装其他任何的工具，只需要用 shell 的管道操作符将 zfs send 的字节流重定向到 ssh 命令即可。这个方案非常具有技术美感，但考虑到块存储的价格是对象存储的十倍以上，最后还是放弃了这个方案。

## 成本核算
硬件上其实我预算并不紧张，留的余量也比较大，如果换一些性价比更高的硬件的话，价格还可以下降很多。

- 主机（主板、CPU、内存、系统盘） 3500 元
- 硬盘（4 \* 4T） 2200 元（其实目前只买了一块，其他三块是旧的）

考虑到我之前的群辉用了五年，新的 NAS 设计使用寿命定在十年：

- 硬件成本折合每年 570 元
- 电费（35W）每年 110 元
- 远程访问每年 100 元（国内年付促销服务器，如有公网 IP 使用 DDNS 则无需此项）
- 异地备份每年 415 元（按量付费，这里按 1T 需要异地备份的数据计算）

总共 12T 的容量每年 1195 元，折合 1T 每月 8 元，如果去掉远程访问和异地备份的话则是 1T 每月 5 元。

## 为什么要用自部署方案
相比于使用云服务，第一个理由自然是对数据的「掌控感」，虽然没有什么确凿的理由说云服务就一定不安全，但有些人就是喜欢这种对个人数据的掌控感。

还有一个技术原因是部署在家中内网的 NAS 可以通过 SMB 简单地支持一些「在线编辑」，如直接加载 NAS 上的素材进行视频剪辑、甚至将整个工程文件都直接放在 NAS 上。使用云服务的话一方面是没有 SMB 协议的支持，即使支持延迟对于在线编辑来说也是无法接受的。

另外一个不能忽略的话题就是成本，在这里我们只考虑以容量为计价方案的网盘服务，iCloud、Google Drive、Dropbox 的价格方案都非常接近，在超过 200G（大概 $3）这一档之后就直接跳到了 2T（大概 $10），这时云服务按量付费的优势其实就没有了，是一个切换到自部署方案的一个不错的时间点，一次性投入之后只需 2 - 3 年即可回本。

当然最重要的一点是兴趣，在这个折腾的过程中你需要做很多决定、遇到很多困难，最后搭建出来一个几乎是独一无二的自部署方案。如果你能在这个过程中找到乐趣的话，那当然是非常值得的；反过来如果你没有兴趣，算上投入的时间成本，自部署方案的性价比将会非常低。

任何自部署的方案都需要长期的维护才能保持工作，对后端运维完全没有兴趣怎么办，不如了解一下 [LeanCloud](https://www.leancloud.cn/)，领先的 BaaS 提供商，为移动开发提供强有力的后端支持。
