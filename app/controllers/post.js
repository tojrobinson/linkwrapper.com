'use strict';

var model = require('../model');
var config = require('r/config/settings');
var passport = require('passport');

module.exports = {
   // local login
   login: function(req, res, next) {
      passport.authenticate('local', function(err, user, info) {
         if (err) {
            res.render('index');
         } else if (!user) {
            res.render('index', {err: info});
         } else {
            req.logIn(user, function(err) {
               if (err) {
                  res.res.render('index', {err: info});
               } else {
                  res.redirect('/player');
               }
            });
         }
      })(req, res, next);
   },

   register: function(req, res) {
      var password = req.body.password;
      var passConfirm = req.body.passConfirm;

      if (!password || password !== passConfirm) {
         var err =  {msg: 'Passwords are required and must match.'};
         return res.render('register',  {err: err});
      }

      var newUser = {
         type: 'local',
         display: req.body.display,
         password: req.body.password,
         email: req.body.email,
         joined: new Date(),
         active: false,
         settings: {
            theme: 'light',
            suggestions: 'youtube',
            sideBar: 'default'
         },
         categories: [{name: config.defaultCategory, order: 0}],
         playlists: []
      };

      model.userDao.newUser(newUser, function(err, user) {
         if (err) {
            res.render('register', {err: err});
         } else {
            res.render('notifications/registerSuccess', { email: newUser.email });
         }
      });
   }
};
