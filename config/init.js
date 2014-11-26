'use strict';

var config = require('./settings.js');
var c = require('r/app/controllers');
var auth = require('./auth.js');
var path = require('path');
var express = require('express');
var passport = require('passport');
var dust = require('adaro');
var logger = require('morgan');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var errorHandler = require('errorhandler');
var bodyParser = require('body-parser');

module.exports = function(app) {
   app.engine('dust', dust.dust({}));

   app.set('views', path.join(__dirname, '..', 'app', 'views'));
   app.set('view engine', 'dust');
   app.disable('x-powered-by');
   app.use(express.static(path.join(__dirname, '..', 'public')));

   app.use(bodyParser.urlencoded({
      extended: true
   }));
   app.use(methodOverride());
   app.use(cookieParser());
   app.use(cookieSession({
      secret: config.secret,
      cookie: {
         httpOnly: true,
         expires: false
      }
   }));

   // init passport
   auth(passport);
   app.use(passport.initialize());
   app.use(passport.session());

   // init error handlers
   if ('development' === app.get('env')) {
      app.use(logger('dev'));
      app.use(errorHandler());
   } else {
      app.use(c.error.notFound);
      app.use(c.error.server);
   }
}
