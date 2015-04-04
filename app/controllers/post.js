'use strict';

var model = require('../model');
var config = require('r/config/settings');
var validate = require('r/app/util/recaptcha');
var d = require('r/app/views/dialogues');
var mail = require('r/app/util/mail');
var log = require('r/app/util/log');
var passport = require('passport');

module.exports = {
   // local login
   login: function(req, res, next) {
      passport.authenticate('local', function(err, user, info) {
         if (err) {
            log.error({req: req, err: err});
            res.render('login');
         } else if (!user) {
            res.render('login', info);
         } else {
            req.logIn(user, function(err) {
               if (err) {
                  log.error({req: req, err: err});
                  res.render('login', info);
               } else {
                  res.redirect('/player');
               }
            });
         }
      })(req, res, next);
   },

   register: function(req, res) {
      var form = req.body;
      form.display = form.display || '';
      form.email = form.email || '';

      if (!form.password.length || form.password !== form.passConfirm) {
         return res.render('register',  {
            msg: 'Passwords are required and must match.'
         });
      } else if (!mail.validEmail(form.email)) {
         return res.render('register', d.pack({code: 136}));
      }
      
      if (form.display.length >= 15) {
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
         if (err) {
            log.error({req: req, err: err});
         }

         if (result.code >= d.ERROR) {
            res.render('register', d.pack(result));
         } else {
            res.render('notify/registered', result.data);
         }
      });
   },

   guest: function(req, res) {
      var recaptcha = req.body['g-recaptcha-response'] || '';

      if (!recaptcha.trim()) {
         return res.redirect('/');
      }

      validate(recaptcha, function(err, success) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (err || !success) {
            return res.redirect('/');
         }

         model.userDAO.newGuest(function(err, guest) {
            if (err) {
               log.error({req: req, err: err});
            }

            if (err || !guest) {
               return res.render('login');
            }

            var initCategory = {
               name: config.initCategory,
               owner: guest._id,
               order: 0
            };

            model.listDAO.addList('category', initCategory, function(err) {
               req.logIn(guest, function(err) {
                  if (err) {
                     log.error({req: req, err: err});
                     res.render('login');
                  } else {
                     res.redirect('/player');
                  }
               });
            });
         });
      });
   },
   
   recoverAccount: function(req, res) {
      if (req.body.isBotText || req.body.isBotBox) {
         return res.redirect('/');
      }

      var email = req.body.email;
      email = email && email.toLowerCase();

      if (!mail.validEmail(email)) {
         return res.render('recover', d.pack({code: 136}));
      }

      model.userDAO.recoverAccount(email, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (result.code >= d.ERROR) {
            return res.render('recover', d.pack(result));
         }

         res.render('notify/sentRecovery', {
            email: email
         });
      });
   },

   resetPassword: function(req, res) {
      if (req.body.isBotText || req.body.isBotBox) {
         return res.redirect('/');
      }

      var id = req.body.t;
      var password = req.body.password;
      var passConfirm = req.body.passConfirm;

      if (!password || password !== passConfirm) {
         return res.render('reset', {
            id: id,
            msg: 'Passwords are required and must match.'
         });
      }

      model.transactionDAO.get(id, function(err, t) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (err || !t) {
            return res.render('notify/reset', d.pack({code: 141}));
         }

         model.userDAO.resetPassword(t.user, password, function(err, result) {
            if (err) {
               log.error({req: req, err: err});
            }

            if (result.code >= d.ERROR) {
               var ctx = d.pack(result);
               ctx.id = t;
               return res.render('reset', ctx);
            }

            res.render('notify/reset', {});
         });
      });
   }
};
