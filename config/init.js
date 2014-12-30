'use strict';

var config = require('./settings.js');
var auth = require('./auth.js');
var m = require('r/app/util/middleware');
var path = require('path');
var express = require('express');
var passport = require('passport');
var dust = require('adaro');
var logger = require('morgan');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');

module.exports = function(app) {
   app.engine('dust', dust.dust({}));

   app.set('views', path.join(__dirname, '..', 'app', 'views'));
   app.set('view engine', 'dust');
   app.disable('x-powered-by');

   app.use(bodyParser.json({
      limit: 1024 * 1024 * 3
   }));

   app.use(bodyParser.urlencoded({
      extended: true,
      limit: '50kb'
   }));

   app.use(cookieSession({
      secret: config.secret,
      cookie: {
         httpOnly: true,
         expires: false,
         signed: true
      }
   }));

   // init passport
   auth(passport);
   app.use(passport.initialize());
   app.use(passport.session());

   if (app.get('env') === 'development') {
      app.use(logger('dev'));
      app.use(express.static(path.join(__dirname, '..', 'public')));
   }
}
