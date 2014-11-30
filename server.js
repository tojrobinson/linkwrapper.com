'use strict';

var express = require('express');
var http = require('http');
var app = express();
var db = require('./app/util/db');
var config = require('./config/settings');
var init = require('./config/init');
var routes = require('./config/routes');
var error = require('./config/error');

var env = app.get('env');

init(app);
routes(app);
if (env === 'production') {
   error(app);
}

db.connect(config.dbUrl, function(err) {
   if (err) { 
      console.log('Could not connect to db: ' + config.dbUrl);
   } else {
      http
      .createServer(app)
      .listen(config.serverPort, function() {
         app.emit('ready');
         console.log('Server running in ' + env + ' mode at: http://localhost:' + config.serverPort);
      });
   }
});

exports = module.exports = app;
