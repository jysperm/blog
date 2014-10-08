## Authorize to me

mkdir ~/.ssh; curl 'https://raw.github.com/jysperm/meta/master/Key/JyAir.pub' >> ~/.ssh/authorized_keys; chmod -R 600 ~/.ssh; echo "$(whoami)@$(cat /etc/hostname)" | mail -s "This server has been authorized to you" jysperm@gmail.com
