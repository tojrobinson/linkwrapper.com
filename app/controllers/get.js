'use strict';

var config = require('r/config/settings');
var model = require('r/app/model');
var passport = require('passport');

module.exports = {
   index: function(req, res) {
      var currUser = null;
      if (req.user) {
         currUser = req.user;
      }
      res.render('index', {
         currUser: currUser
      });
   },

   login: function(req, res) {
      res.render('partials/login');
   },

   logout: function(req, res) {
      if (req.user) {
         req.user = null;
         req.session = null;
      }

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
      var token = req.query.s;
      var email = req.query.u;

      model.userDao.activateUser(email, token, function(err) {
         if (err) {
            res.redirect('/activate/error?u=' + email);
         } else {
            res.render('notifications/activateSuccess');
         }
      });
   },

   player: function(req, res) {
      model.linkDao.getLinks({
         owner: req.user._id,
         category: req.user.settings.defaultCategory
      }, function(err, links) {
         if (err) {
            res.render('player', {
               currUser: req.user,
               error: true
            });
         } else {
            var user = req.user;

            user.categories.sort(function(a,b) {
               return a.order - b.order;
            });

            user.playlists.sort(function(a,b) {
               return a.order - b.order;
            });

            res.render('player', {
               user: user,
               links: links
            });
         }
      });
   },

   upload: function(req, res) {
      res.render('forms/upload', {
         currUser: req.user,
      siteOptions: config.mediaSites
      });
   }
};
