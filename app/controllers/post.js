'use strict';

var model = require('../model');
var config = require('r/config/settings');
var passport = require('passport');
var dialogues = require('r/app/views/dialogues');
var mail = require('r/app/util/mail');

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
                  res.render('index', info);
               } else {
                  res.redirect('/player');
               }
            });
         }
      })(req, res, next);
   },

   register: function(req, res) {
      var form = req.body;

      if (!form.password || form.password !== form.passConfirm) {
         return res.render('register',  {
            msg: 'Passwords are required and must match.'
         });
      } else if (!mail.validEmail(form.email)) {
         return res.render('register', {
            msg: 'Invalid email address.'
         });
      }

      var newUser = {
         type: 'local',
         display: form.display.trim(),
         password: form.password,
         email: form.email.trim(),
         joined: new Date(),
         active: false,
         settings: {
            theme: 'light',
            suggestions: 'youtube'
         }
      };

      model.userDao.newUser(newUser, function(code, user) {
         if (code !== dialogues.SUCCESS || !user) {
            res.render('register', dialogues.pack(code));
         } else {
            var initCategory = {
               name: config.initCategory,
               owner: user[0]._id,
               order: 0
            };

            model.listDao.addList('category', initCategory, function(err) {
               res.render('notify/registered', { email: newUser.email });
            });
         }
      });
   }
};
