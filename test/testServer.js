'use strict';

var express = require('express');
var http = require('http');
var app = express();
var db = require('r/app/util/db');
var config = require('r/config/settings');
var routes = require('r/config/routes');
var init = require('r/config/init');

init(app);
routes(app);

db.connect(config.testDbUrl, function(err) {
   if (err) { 
      console.log(err);
   } else {
      http
      .createServer(app)
      .listen(config.serverPort, function() {
         console.log('Test server running at: http://localhost:' + config.serverPort);
      });
   }
});
