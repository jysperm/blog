## Ubuntu 14.04 amd64

    apt-get install python-software-properties software-properties-common
    add-apt-repository ppa:chris-lea/node.js
    apt-get update
    apt-get upgrade

    apt-get install python g++ make nodejs git nginx redis-server supervisor mongodb mariadb-server
    apt-get install screen wget zip unzip iftop vim curl htop iptraf nethogs ntp

    npm install coffee-script http-server hexo gulp mocha harp bower -g

    useradd -m jysperm
    usermod -G jysperm -a www-data
