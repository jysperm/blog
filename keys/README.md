## Authorize to me

> mkdir ~/.ssh; curl 'https://raw.githubusercontent.com/jysperm/meta/master/keys/JyAir.pub' >> ~/.ssh/authorized_keys; chmod -R 700 ~/.ssh; echo "$(whoami)@$(cat /etc/hostname)" | mail -s "This server has been authorized to you" jysperm@gmail.com
