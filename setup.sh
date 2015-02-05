#!/bin/bash

sudo npm install
ln -s $(pwd) node_modules/r

if [ ! -d "./app/views/mail/emailified" ]
then
   cd ./app/views/mail
   node emailify *.html
   cd -
fi

npm run build

[ ! -e "./config/settings.js" ] && echo "WARNING: must supply a ./config/settings.js file."
