#!/bin/bash

sudo npm install
ln -s $(pwd) node_modules/r

[ ! -e "./config/settings.js" ] && echo "WARNING: must supply a ./config/settings.js file."
