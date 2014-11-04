'use strict';

var model = require('../model');
var config = require('r/config/settings');
var extractor = require('r/app/util/extractor');
var passport = require('passport');

module.exports = {
   // local login
   login: function(req, res, next) {
      passport.authenticate('local', function(err, user, info) {
         if (err) {
            res.render('forms/loginLocal');
         } else if (!user) {
            res.render('forms/loginLocal', info);
         } else {
            req.logIn(user, function(err) {
               if (err) {
                  res.res.render('forms/loginLocal', info);
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
         return res.render('forms/register',  {err: err});
      }

      var newUser = {
         type: 'local',
         display: req.body.display,
         password: req.body.password,
         email: req.body.email,
         joined: new Date(),
         active: false,
         settings: {
            theme: 'light'
         },
         categories: [{name: config.defaultCategory, order: 0}],
         playlists: []
      };

      model.userDao.newUser(newUser, function(err, user) {
         if (err) {
            res.render('forms/register', {err: err});
         } else {
            res.render('notifications/registerSuccess', { email: newUser.email });
         }
      });
   },

   upload: function(req, res) {
      var multiparty = require('multiparty');
      var form = new multiparty.Form({encoding: 'utf8', maxFileSize: '5MB', maxFieldsSize: 50});

      form.parse(req, function(err, fields, files) {
         if (err) {
            res.render('forms/upload', {message: 'Invalid form data was submitted.'});
         } else if (!files.links[0].originalFilename.trim()) {
            res.render('forms/upload', {message: 'Must specify a file to upload.'});
         } else {
            try {
               var file = files.links[0].path;
               extractor.extract(file, {
                  userId: req.user._id,
                  category: fields.category[0].toLowerCase()
               }, function(err, report) {
                  if (err) {
                     console.log(err);
                     res.render('forms/upload', {
                        message: 'An error occurred while gathering links from the uploaded file.'
                     });
                  } else {
                     req.report = report;
                     res.redirect('/player');
                  }
               });
            } catch(e) {
               res.render('forms/upload', {
                  message: 'An error occurred while gathering links from the uploaded file.'
               });
            }
         }
      });
   }
};
