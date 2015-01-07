'use strict';

var express = require('express');
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

if (env === 'testing') {
   config.dbUrl = 'mongodb://localhost:27017/lw_test';
}

db.connect(config.dbUrl, env, function(err) {
   if (err) { 
      console.log('Could not connect to db: ' + config.dbUrl);
   } else {
      app.listen(config.port, function() {
         app.emit('ready');
         console.log('Server running in ' + env + 
                     ' mode using node ' + process.version + 
                     ' at: ' + config.domain + ':' + config.port);
      });
   }
});

exports = module.exports = app;
