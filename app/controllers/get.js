'use strict';

var config = require('r/config/settings');
var model = require('r/app/model');
var d = require('r/app/views/dialogues');
var log = require('r/app/util/log');
var passport = require('passport');

module.exports = {
   index: function(req, res) {
      res.render('index');
   },

   login: function(req, res) {
      res.render('partials/login');
   },

   logout: function(req, res) {
      req.logout();
      req._destroySession();
      res.redirect('/');
   },

   processLogin: function(req, res, done) {
      var type = req.params.loginType;
      var validTypes = config.loginMethods;

      if (!type || (validTypes.indexOf(type) < 0)) {
         res.redirect('/login');
      } else if (type === 'local') {
         res.render('forms/loginLocal');
      } else {
         passport.authenticate(type, config[type].parameters)(req, res, done);
      }
   },

   verifyLogin: function(req, res, done) {
      var type = req.params.loginType;
      var validTypes = config.loginMethods;

      if (!type || (validTypes.indexOf(type) < 0)) {
         res.redirect('/login');
      } else {
         passport.authenticate(type, {
            successRedirect: '/player',
            failureRedirect: '/login'
         })(req, res, done);
      }
   },

   register: function(req, res) {
      res.render('register');
   },

   activateUser: function(req, res) {
      var id = req.params.id;

      model.userDAO.activateUser(id, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (result.code === d.SUCCESS && result.data) {
            model.listDAO.addList('category', {
               name: config.initCategory,
               owner: result.data._id,
               order: 0
            }, function(err) {
               if (err) {
                  log.error({req: req, err: err});
               }
            });
         }

         res.render('notify/activated', d.pack(result));
      });
   },

   confirmEmail: function(req, res) {
      var id = req.params.id;

      model.userDAO.confirmEmail(id, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         res.render('notify/emailUpdated', d.pack(result));
      });
   },

   recoverAccount: function(req, res) {
      res.render('recover');
   },

   resetPassword: function(req, res) {
      var id = req.params.id;

      model.transactionDAO.get(id, function(err, t) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (err || !t) {
            return res.render('notify/reset', d.pack({code: 141}));
         }

         res.render('reset', {
            id: id
         });
      });
   },

   player: function(req, res) {
      model.userDAO.getUserLists(req.user._id, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (result.code !== d.SUCCESS) {
            return res.render('player', d.pack(result));
         }

         res.render('player', result.data);
      });
   }
};
