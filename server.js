'use strict';

var express = require('express');
var http = require('http');
var app = express();
var db = require('./app/util/db');
var config = require('./config/settings');
var routes = require('./config/routes');
var init = require('./config/init');

init(app);
routes(app);

db.connect(function(err) {
   if (err) { 
      console.log('Could not connect to db: ' + config.dbUrl);
   } else {
      http
      .createServer(app)
      .listen(config.serverPort, function() {
         console.log(config.appName + ' running in ' + app.get('env') + ' mode at: ' + config.serverUrl);
      });
   }
});
