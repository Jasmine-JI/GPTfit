#!/bin/bash
HOME="/home/project/alatech_api_py38"
API_SERVER="/var/web"
IP_ADDR=$(ifconfig | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p')
rm -rf /var/www/html/dist
mkdir -p /var/www/html/dist
echo $IP_ADDR
if [ ! -h /var/www/html/dist/ ]; then
  mkdir dist
fi
if [ ! -h /var/www/html/dist/index.html ]; then
  ln -s /var/www/html/index.html /var/www/html/dist/
fi
if [ ! -L /var/www/html/dist/.htaccess ]; then
  ln -s /var/www/html/.htaccess /var/www/html/dist/
fi
if [ ! -L /var/www/html/dist/app ]; then
        ln -s /var/www/html/app /var/www/html/dist/app
fi
tempIP=${IP_ADDR%192.168.1.235}
if [ "${IP_ADDR#$tempIP}" == "192.168.1.235" ]; then
  API_SERVER="/home/dezhi/web"
  echo "!!!!!!!!!!!!!!!!!!!!!!!"
  if [ ! -L /var/www/html/dist/gptdbtool ]; then
          ln -s /usr/share/phpmyadmin /var/www/html/dist/gptdbtool
  fi
  if [ ! -L /var/www/html/dist/RD_FW_2 ]; then
        ln -s /var/www/html/RD_FW_2 /var/www/html/dist/RD_FW_2
  fi
elif [ $IP_ADDR == "192.168.1.234" ]; then
  if [ ! -L /var/www/html/dist/alatech ]; then
          ln -s /home/project/alatech_cloud/atechrwd/ /var/www/html/dist/alatech
  fi
  if [ ! -L /var/www/html/dist/map ]; then
          ln -s /var/www/html/map/ /var/www/html/dist/map
  fi
  if [ ! -L /var/www/html/dist/gptdbtool ]; then
          ln -s /usr/share/phpmyadmin /var/www/html/dist/gptdbtool
  fi
  if [ ! -L /var/www/html/dist/RD_FW ]; then
          ln -s /var/www/html/RD_FW /var/www/html/dist/RD_FW
  fi
  if [ ! -h /var/www/html/dist/api ]; then
          ln -s /var/www/html/api /var/www/html/dist/api
  fi
  if [ ! -L /var/www/html/dist/ba19f544a4fc779ec2c689184906748c ]; then
          ln -s /var/www/html/ba19f544a4fc779ec2c689184906748c /var/www/html/dist/ba19f544a4fc779ec2c689184906748c
  fi
  if [ ! -L /var/www/html/dist/d67e2f48a7425feb0a0fcedbffd9f4ad ]; then
          ln -s /var/www/html/d67e2f48a7425feb0a0fcedbffd9f4ad /var/www/html/dist/d67e2f48a7425feb0a0fcedbffd9f4ad
  fi
  if [ ! -L /var/www/html/dist/.well-known ]; then
    ln -s /var/www/html/.well-known /var/www/html/dist/.well-known
  fi
  if [ ! -L /var/www/html/dist/RD_FW_2 ]; then
        ln -s /var/www/html/RD_FW_2 /var/www/html/dist/RD_FW_2
  fi
  if [ ! -L /var/www/html/dist/img ]; then
        ln -s /var/cloud/img /var/www/html/dist/img
  fi
elif [ $IP_ADDR == "192.168.1.232" ]; then
  if [ ! -h /var/www/html/dist/angular ]; then
          ln -s /var/www/html/angular /var/www/html/dist/angular
  fi
  if [ ! -h /var/www/html/dist/atech ]; then
          ln -s /home/svnroot/atech/ /var/www/html/dist/atech
  fi
  if [ ! -h /var/www/html/dist/atechrwd ]; then
          ln -s /home/vincent/gitlab/alatech_cloud/atechrwd /var/www/html/dist/atechrwd
  fi
  if [ ! -h /var/www/html/dist/atechRwd ]; then
          ln -s /home/svnroot/atechRwd/ /var/www/html/dist/atechRwd
  fi
  if [ ! -h /var/www/html/dist/atechrwd.svn ]; then
          ln -s /home/svnroot/atechrwd/ /var/www/html/dist/atechrwd.svn
  fi
  if [ ! -h /var/www/html/dist/bugzilla ]; then
          ln -s /var/www/html/bugzilla /var/www/html/dist/bugzilla
  fi
  if [ ! -h /var/www/html/dist/fed ]; then
          ln -s /var/www/html/fed /var/www/html/dist/fed
  fi

  if [ ! -L /var/www/html/dist/gptdbtool ]; then
          ln -s /usr/share/phpmyadmin /var/www/html/dist/gptdbtool
  fi
  if [ ! -L /var/www/html/dist/public ]; then
          ln -s /var/www/html/public /var/www/html/dist/public
  fi
  if [ ! -L /var/www/html/dist/RD_FW ]; then
          ln -s /var/www/html/RD_FW /var/www/html/dist/RD_FW
  fi
  if [ ! -L /var/www/html/dist/test ]; then
          ln -s /var/www/html/test /var/www/html/dist/test
  fi
  if [ ! -L /var/www/html/dist/RD_FW_2 ]; then
        ln -s /var/www/html/RD_FW_2 /var/www/html/dist/RD_FW_2
  fi
  if [ ! -L /var/www/html/dist/img ]; then
        ln -s /var/cloud/img /var/www/html/dist/img
  fi
else
  if [ ! -L /var/www/html/dist/alatech ]; then
          ln -s /home/project/alatech_cloud/atechrwd/ /var/www/html/dist/alatech
  fi

  if [ ! -L /var/www/html/dist/gptdbtool ]; then
          ln -s /usr/share/phpmyadmin /var/www/html/dist/gptdbtool
  fi
  if [ ! -L /var/www/html/dist/RD_FW ]; then
          ln -s /var/www/html/RD_FW /var/www/html/dist/RD_FW
  fi
  if [ ! -L /var/www/html/dist/ba19f544a4fc779ec2c689184906748c ]; then
          ln -s /var/www/html/ba19f544a4fc779ec2c689184906748c /var/www/html/dist/ba19f544a4fc779ec2c689184906748c
  fi
  if [ ! -L /var/www/html/dist/d67e2f48a7425feb0a0fcedbffd9f4ad ]; then
          ln -s /var/www/html/d67e2f48a7425feb0a0fcedbffd9f4ad /var/www/html/dist/d67e2f48a7425feb0a0fcedbffd9f4ad
  fi
  if [ ! -L /var/www/html/dist/.well-known ]; then
          ln -s /var/www/html/.well-known /var/www/html/dist/.well-known
  fi
  if [ ! -L /var/www/html/dist/RD_FW_2 ]; then
        ln -s /var/www/html/RD_FW_2 /var/www/html/dist/RD_FW_2
  fi
  if [ ! -L /var/www/html/dist/img ]; then
        ln -s /var/cloud/img /var/www/html/dist/img
  fi
fi
cd $API_SERVER
cp -a dist/* /var/www/html/dist

cd $API_SERVER
npm run pm2-start

# /usr/lib/vino/vino-server &
