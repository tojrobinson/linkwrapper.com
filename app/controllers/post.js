'use strict';

var models = require('../models');
var bcrypt = require('bcrypt');
var passport = require('passport');
var config = require('r/config/settings');
var mailer = require('r/app/utils').mail;

// local login
exports.login = function(req, res, next) {
   passport.authenticate('local', function(err, user, info) {
      if (err) {
         res.render('forms/loginLocal');
      } else if (!user) {
         res.render('forms/loginLocal', info);
      } else {
         res.redirect('/player');
      }
   })(req, res, next);
}

exports.register = function(req, res) {
   var newUser = {
      type: 'local',
      first: req.body.firstName,
      last: req.body.lastName,
      password: req.body.password,
      email: req.body.email,
      joined: new Date()
   };

   var genericError = 'An error occurred during registration. Please check your details and try again.';

   if (!newUser.password) {
      res.render('forms/register', {passwordNotification: 'Password is required.' });
   } else if (newUser.password !== req.body.passConfirm) {
      res.render('forms/register', {passwordNotification: 'Password missmatch.' });
   } else {
      bcrypt.hash(newUser.password, config.hashStrength, function(err, hash) {
         if (err) {
            return res.redirect('/register');
         }

         newUser.password = hash;
         models.userDao.addUser(newUser, function(err, user) {
            if (err) {
               res.render('forms/register', { mainNotification: genericError});
            } else if (!user) {
               res.render('forms/register', { mainNotification: 'The email address ' + newUser.email + ' is already in use.'});
            } else {
               bcrypt.hash(config.secret, config.hashStrength, function(err, hash) {
                  if (err) {
                     console.error(err);
                     return res.render('forms/register', { mainNotification: genericError});
                  }

                  mailer.sendMail({
                     from: config.defaultEmail,
                     to: newUser.email,
                     subject: 'New Link Wrapper Account',
                     text: 'Welcome to Link Wrapper!\nPlease follow the link below to activate your new account:\n http://localhost:8055/activate?s=' + hash + '&u=' + user._id
                  }, function(err, response) {
                     if (err) {
                        console.error(err);
                     }
                     if (response) {
                        //TODO
                     }
                  });
               });

               res.render('notifications/registerSuccess', { email: newUser.email });
            }
         });
      });
   }
}

exports.upload = function(req, res) {
   var multiparty = require('multiparty'),
       form = new multiparty.Form({encoding: 'utf8', maxFileSize: '5MB', maxFieldsSize: 50}),
       extractor = require('r/app/utils').extractor;

   form.parse(req, function(err, fields, files) {
      if (err) {
         res.render('forms/upload', {message: 'Invalid form data was submitted.'});
      } else if (!files.links[0].originalFilename.trim()) {
         res.render('forms/upload', {message: 'Must specify a file to upload.'});
      } else {
         try {
            var file = files.links[0].path;
            extractor.extract(file, {userId: req.user._id, category: fields.category[0].toLowerCase()}, function(err, report) {
               if (err) {
                  console.log(err);
                  res.render('forms/upload', {message: 'An error occurred while gathering links from the uploaded file.'});
               } else {
                  req.report = report;
                  res.redirect('/player');
               }
            });
         } catch(e) {
            res.render('forms/upload', {message: 'An error occurred while gathering links from the uploaded file.'});
         }
      }
   });
}
