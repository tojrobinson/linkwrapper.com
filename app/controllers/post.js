'use strict';

var model = require('../model');
var config = require('r/config/settings');
var passport = require('passport');
var dialogues = require('r/app/views/dialogues');

module.exports = {
   // local login
   login: function(req, res, next) {
      passport.authenticate('local', function(err, user, info) {
         if (err) {
            res.render('index');
         } else if (!user) {
            res.render('index', info);
         } else {
            req.logIn(user, function(err) {
               if (err) {
                  res.res.render('index', info);
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
         return res.render('register',  err);
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
            suggestions: 'youtube'
         }
      };

      model.userDao.newUser(newUser, function(code, user) {
         if (err || !user) {
            res.render('register', dialogues.pack(code));
         } else {
            var initCategory = {
               name: config.initCategory,
               owner: user[0]._id,
               order: 0
            };

            model.listDao.addList('category', initCategory, function(err) {
               res.render('notifications/registerSuccess', { email: newUser.email });
            });
         }
      });
   }
};
