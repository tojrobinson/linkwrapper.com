'use strict';

var passport = require('passport');
var config = require('r/config/settings');
var bcrypt = require('bcrypt');
var models = require('r/app/models');

exports.index = function(req, res) {
   var currUser = null;
   if (req.user) {
      currUser = req.user;
   }
   res.render('index', {
      currUser: currUser
   });
}

exports.login = function(req, res) {
   res.render('partials/login');
}

exports.logout = function(req, res) {
   if (req.user) {
      req.user = null;
      req.session = null;
   }

   res.redirect('/');
}

exports.processLogin = function(req, res, done) {
   var type = req.params.loginType;
   var validTypes = config.loginMethods;

   if (!type || (validTypes.indexOf(type) < 0)) {
      res.redirect('/login');
   } else if (type === 'local') {
      res.render('forms/loginLocal');
   } else {
      passport.authenticate(type, config[type].parameters)(req, res, done);
   }
}

exports.verifyLogin = function(req, res, done) {
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
}

exports.register = function(req, res) {
   res.render('forms/register');
}

exports.activateUser = function(req, res) {
   var secretHash = req.query.s,
       userId = req.query.u;

   bcrypt.compare(config.secret, secretHash, function(err, result) {
      if (err) {
         console.error(err);
         res.redirect('/activate/error?u=' + userId);
      } else if (result) {
         models.userDao.updateUser(userId, {active: true}, function(err) {
            if (err) {
               res.redirect('/activate/error?u=' + userId);
            } else {
               res.render('notifications/activateSuccess');
            }
         });
      } else {
         res.redirect('/activate/error?u=' + userId);
      }
   });
}

exports.player = function(req, res) {
   models.linkDao.getLinks({
      owner: req.user._id,
      category: req.user.settings.defaultCategory
   }, function(err, links) {
      if (err) {
         res.render('player', {
            currUser: req.user,
            error: true
         });
      } else {
         res.render('player', {
            currUser: req.user,
            links: links
         });
      }
   });
}

exports.upload = function(req, res) {
   res.render('forms/upload', {
      currUser: req.user,
      siteOptions: config.mediaSites
   });
}
