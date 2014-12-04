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
      var email = req.query.u;
      var token = req.query.s;
      model.userDao.activateUser(email, token, function(err) {
         res.render('notify/activated', {error: err});
      });
   },

   confirmEmail: function(req, res) {
      var email = req.query.u;
      var token = req.query.s;
      model.userDao.confirmEmail(email, token, function(err, msg) {
         res.render('notify/emailUpdated', {error: err, msg: msg});
      });
   },

   player: function(req, res, next) {
      var user = req.user;

      model.userDao.getUserLists(user._id, function(code, lists) {
         if (code !== 0) {
            res.render('player', {
               user: user,
               err: 'An error occurred while retrieving your lists.'
            });
         } else {
            res.render('player', {
               user: user,
               categories: lists.categories,
               playlists: lists.playlists
            });
         }
      });
   }
};
