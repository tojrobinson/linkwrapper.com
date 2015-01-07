'use strict';

var model = require('../model');
var config = require('r/config/settings');
var passport = require('passport');
var d = require('r/app/views/dialogues');
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
         return res.render('register', d.pack({code: 136}));
      }
      
      if (!(form.display.length < 15)) {
         return res.render('register', {
            msg: 'Display must be less than 15 characters.'
         });
      }

      var newUser = {
         type: 'local',
         display: form.display.trim(),
         password: form.password,
         email: form.email.trim().toLowerCase(),
         joined: new Date(),
         settings: {
            theme: 'light',
            suggestions: 'youtube'
         }
      };

      model.userDAO.newUser(newUser, function(err, result) {
         var user = result.data;

         if (result.code >= d.ERROR) {
            res.render('register', d.pack(result));
         } else {
            res.render('notify/registered', result.data);
         }
      });
   },

   guest: function(req, res) {
      model.userDAO.newGuest(function(err, guest) {
         if (err || !guest) {
            return res.render('index');
         }

         var initCategory = {
            name: config.initCategory,
            owner: guest._id,
            order: 0
         };

         model.listDAO.addList('category', initCategory, function(err) {
            req.logIn(guest, function(err) {
               if (err) {
                  res.render('index');
               } else {
                  res.redirect('/player');
               }
            });
         });
      });
   }
};
