#!/bin/bash

sudo npm install
ln -s $(pwd) node_modules/r

# hack until nodemon fixed or stop using ln
sed -i 's/stat\(file/lstat(file/' node_modules/nodemon/lib/monitor/watch.js

[ ! -e "./config/settings.js" ] && echo "WARNING: must supply a ./config/settings.js file."
