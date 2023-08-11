---
title: 为什么在 Apple Silicon 上装 Docker 这么难
tags:
  - Docker
alias: install-docker-on-apple-silicon
date: 2022-02-18
---
最近公司的很多同事都换上了搭载 M1 Pro 或 M1 Max 的新款 MacBook Pro，虽然日常使用的软件如 Chrome、Visual Studio Code 和 Slack 都已经适配得很好了，但面对 Docker 却犯了难。

众所周知，Docker 用到了 Linux 的两项特性：namespaces 和 cgroups 来提供隔离与资源限制，因此无论如何在 macOS 上我们都必须通过一个虚拟机来使用 Docker。

在 2021 年 4 月时，Docker for Mac（Docker Desktop）[发布了](https://www.docker.com/blog/released-docker-desktop-for-mac-apple-silicon/) 对 Apple Silicon 的实验性支持，它会使用 QEMU 运行一个 ARM 架构的 Linux 虚拟机，默认运行 ARM 架构的镜像，但也支持运行 x86 的镜像。

{% cdnimage '2022/docker-for-mac.png' %}

[QEMU](https://www.qemu.org/docs/master/about/index.html) 是一个开源的虚拟机（Virtualizer）和仿真器（Emulator），所谓仿真器是说 QEMU 可以在没有来自硬件或操作系统的虚拟化支持的情况下，去模拟运行一台计算机，包括模拟与宿主机不同的 CPU 架构，例如在 Apple Silicon 上模拟 x86 架构的计算机。而在有硬件虚拟化支持的情况下，QEMU 也可以使用宿主机的 CPU 来直接运行，减少模拟运行的性能开销，例如使用 macOS 提供的 `Hypervisor.Framework`。

Docker for Mac 其实就是分别用到了 QEMU 的这两种能力来在 ARM 虚拟机上运行 x86 镜像，和在 Mac 上运行 ARM 虚拟机。

Docker for Mac 确实很好，除了解决新架构带来的问题之外它还对文件系统和网络进行了映射，容器可以像运行在本机上一样访问文件系统或暴露网络端口到本机，几乎感觉不到虚拟机的存在。但 LeanCloud 加入 TapTap 之后已经不是小公司了，按照 Docker Desktop 在 2021 年 8 月推出的 [新版价格方案](https://www.docker.com/blog/updating-product-subscriptions/)，我们每个人需要支付至少 $5 每月的订阅费用。倒不是我们不愿意付这个钱，只是我想要找一找开源的方案。

之前在 Intel Mac 上，我们会用 Vagrant 或 minikube 来创建虚拟机，它们底层会使用 VirtualBox 或 HyperKit 来完成实际的虚拟化。但 VirtualBox 和 HyperKit 都没有支持 Apple Silicon 的计划。实际上目前开源的虚拟化方案中只有 QEMU 对 Apple Silicon 有比较好的支持，QEMU 本身只提供命令行的接口，例如 Docker for Mac 调用 QEMU 时的命令行参数是这样：

    /Applications/Docker.app/Contents/MacOS/qemu-system-aarch64 -accel hvf \
    -cpu host -machine virt,highmem=off -m 2048 -smp 5 \
    -kernel /Applications/Docker.app/Contents/Resources/linuxkit/kernel \
    -append linuxkit.unified_cgroup_hierarchy=1 page_poison=1 vsyscall=emulate \
    panic=1 nospec_store_bypass_disable noibrs noibpb no_stf_barrier mitigations=off \
    vpnkit.connect=tcp+bootstrap+client://192.168.65.2:61473/f1c4db329a4a520d73a79eaa1360de7be7d09948a1ac348b04c8e01f6f6eb2c9 \
    console=ttyAMA0 -initrd /Applications/Docker.app/Contents/Resources/linuxkit/initrd.img \
    -serial pipe:/var/folders/12/_bbrd4692hv8r9bx_ggw5kp80000gn/T/qemu-console1367481183/fifo \
    -drive if=none,file=/Users/ziting/Library/Containers/com.docker.docker/Data/vms/0/data/Docker.raw,format=raw,id=hd0 \
    -device virtio-blk-pci,drive=hd0,serial=dummyserial -netdev socket,id=net1,fd=3 -device virtio-net-device,netdev=net1,mac=02:50:00:00:00:01 \
    -vga none -nographic -monitor none

为了实际使用 QEMU 进行开发，我们需要一个使用上更友好的封装，能够自动配置好 Docker 和 Kubernetes（或者至少方便编写像 Vagrantfile 一样的脚本），提供类似 Docker for Mac 的网络映射和文件映射，于是我找到了 Lima。

[Lima](https://github.com/lima-vm/lima) 自称是 macOS 上的 Linux 子系统（macOS subsystem for Linux），它使用 QEMU 运行了一个 Linux 虚拟机，其中安装有 rootless 模式的 containerd，还通过 SSH 提供了文件映射和自动的端口转发。

但为什么是 containerd 而不是 Docker 呢？随着容器编排平台 Kubernetes 如日中天，社区希望将运行容器这个关键环节进行标准化，让引入 Docker 之外的其他容器运行时更加容易，于是 [推出了 Container Runtime Interface](https://kubernetes.io/blog/2016/12/container-runtime-interface-cri-in-kubernetes/) (CRI)。containerd 就是从 Docker 中拆分出的一个 CRI 的实现，相比于 Docker 本体更加精简，现在也交由社区维护。

因此如 Lima 这样新的的开源软件会更偏好选择 containerd 来运行容器，因为组件更加精简会有更好的性能，也不容易受到 Docker 产品层面变化的影响。nerdctl 是与 containerd 配套的命令行客户端（`nerd` 是 `containerd` 的末尾 4 个字母），用法与 docker 或 docker-compose 相似（但并不完全兼容）。

所谓 [rootless](https://rootlesscontaine.rs/) 则是指通过替换一些组件，让容器运行时（containerd）和容器都运行在非 root 用户下，每个用户都有自己的 containerd，这样绝大部分操作都不需要切换到 root 来进行，也可以减少安全漏洞的攻击面。

但我们希望能在本地运行完整的 rootful 模式的 dockerd 和 Kubernetes 来尽可能地模拟真实的线上环境，好在 Lima 提供了丰富的 [自定义能力](https://github.com/lima-vm/lima/blob/master/pkg/limayaml/default.yaml)，我基于社区中的一些脚本（[docker.yaml](https://github.com/lima-vm/lima/blob/master/examples/docker.yaml) 和 [minikube.yaml](https://github.com/afbjorklund/lima/blob/minikube/examples/minikube.yaml)）实现了我们的需求，而且这些自定义的逻辑都被以脚本的形式写到了 yaml 描述文件中，只需一条命令就可以创建出相同的虚拟机。

    ~ ❯ limactl start docker.yaml
    ? Creating an instance "docker" Proceed with the default configuration
    INFO[0005] Attempting to download the image from "https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-arm64.img"
    INFO[0005] Using cache "/Users/ziting/Library/Caches/lima/download/by-url-sha256/ae20df823d41d1dd300f8866889804ab25fb8689c1a68da6b13dd60a8c5c9e35/data"
    INFO[0006] [hostagent] Starting QEMU (hint: to watch the boot progress, see "/Users/ziting/.lima/docker/serial.log")
    INFO[0006] SSH Local Port: 55942
    INFO[0006] [hostagent] Waiting for the essential requirement 1 of 5: "ssh"
    INFO[0039] [hostagent] Waiting for the essential requirement 2 of 5: "user session is ready for ssh"
    INFO[0039] [hostagent] Waiting for the essential requirement 3 of 5: "sshfs binary to be installed"
    INFO[0048] [hostagent] Waiting for the essential requirement 4 of 5: "/etc/fuse.conf to contain \"user_allow_other\""
    INFO[0051] [hostagent] Waiting for the essential requirement 5 of 5: "the guest agent to be running"
    INFO[0051] [hostagent] Mounting "/Users/ziting"
    INFO[0051] [hostagent] Mounting "/tmp/lima"
    INFO[0052] [hostagent] Forwarding "/run/lima-guestagent.sock" (guest) to "/Users/ziting/.lima/docker/ga.sock" (host)
    INFO[0092] [hostagent] Waiting for the optional requirement 1 of 1: "user probe 1/1"
    INFO[0154] [hostagent] Forwarding TCP from [::]:2376 to 127.0.0.1:2376
    INFO[0304] [hostagent] Forwarding TCP from [::]:8443 to 127.0.0.1:8443
    INFO[0332] [hostagent] Waiting for the final requirement 1 of 1: "boot scripts must have finished"
    INFO[0351] READY. Run `limactl shell docker` to open the shell.
    INFO[0351] To run `docker` on the host (assumes docker-cli is installed):
    INFO[0351] $ export DOCKER_HOST=tcp://127.0.0.1:2376
    INFO[0351] To run `kubectl` on the host (assumes kubernetes-cli is installed):
    INFO[0351] $ mkdir -p .kube && limactl cp minikube:.kube/config .kube/config

我还发现了另外一个基于 Lima 的封装 —— [Colima](https://github.com/abiosoft/colima)，默认提供 rootful 的 dockerd 和 Kubernetes，但 Colima 并没有对外暴露 Lima 强大的自定义能力，因此我们没有使用，但对于没那么多要求的开发者来说，也是一个更易用的选择。

在默认的情况下，Lima 中的 Docker 在 Apple Silicon 上只能运行 ARM 架构的镜像，但就像前面提到的那样，我们可以使用 QEMU 的模拟运行的能力来运行其他架构（如 x86）的容器。`qemu-user-static` 是一个进程级别的模拟器，可以像一个解释器一样运行其他架构的可执行文件，我们可以利用 Linux 的一项 [Binfmt_misc](https://en.wikipedia.org/wiki/Binfmt_misc)（[中文版](https://zh.wikipedia.org/wiki/Binfmt_misc)）的特性让 Linux 遇到特定架构的可执行文件时自动调用 `qemu-user-static`，这种能力同样适用于容器中的可执行文件。

社区中也有 [qus](https://dbhi.github.io/qus/) 这样的项目，对这些能力进行了封装，只需执行一行 `docker run --rm --privileged aptman/qus -s -- -p x86_64` 就可以让你的 ARM 虚拟机魔法般地支持运行 x86 的镜像。

    /usr/bin/containerd-shim-runc-v2
    \_ /qus/bin/qemu-x86_64-static /usr/sbin/nginx -g daemon off;
        \_ /qus/bin/qemu-x86_64-static /usr/sbin/nginx -g daemon off;
        \_ /qus/bin/qemu-x86_64-static /usr/sbin/nginx -g daemon off;
        \_ /qus/bin/qemu-x86_64-static /usr/sbin/nginx -g daemon off;
        \_ /qus/bin/qemu-x86_64-static /usr/sbin/nginx -g daemon off;

> 使用 qus 运行 x86 镜像的进程树如上，所有进程（包括创建出的子进程）都自动通过 QEMU 模拟运行。

回到题目中的问题，因为 Docker 依赖于 Linux 内核的特性，所以在 Mac 上必须通过虚拟机来运行；Apple Silicon 作为新的架构，虚拟机的选择比较受限，因为有些镜像并不提供 ARM 架构的镜像，所以有时还有模拟运行 x86 镜像的需求；Docker Desktop 作为商业产品，有足够的精力来去解决这些「脏活累活」，但它在这个时间点选择不再允许所有人免费使用；开源社区中新的项目都希望去 Docker 化，用 containerd 取代 dockerd，但这又带来了使用习惯的变化并且可能与线上环境不一致。因为这些原因，目前在 Apple Silicon 上安装 Docker 还是需要花一些时间去了解背景知识的，但好在依然有这些优秀的开源项目可供选择。

虽然 [云引擎](https://developer.taptap.com/product-intro/cloud-engine) 也是基于 Docker 等容器技术构建的，但云引擎力图为用户提供开箱即用的使用体验而不必自己配置容器环境、编写构建脚本、收集日志和统计数据。如果想得到容器化带来的平滑部署、快速回滚、自动扩容等好处但又不想花时间配置，不如来试试云引擎。

其他参考资料：

- https://www.tutorialworks.com/difference-docker-containerd-runc-crio-oci/
