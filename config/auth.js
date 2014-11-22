'use strict';

var model = require('r/app/model');
var config = require('./settings');
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

module.exports = function(passport) {
   // local
   passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
   },
   function(email, password, done) {
      model.userDao.getUser({email: email}, 
         function(err, user) {
            if (err) {
               return done(err);
            } else if (!user || !user.active) {
               return done(null, false, {msg: 'Invalid email or password.'});
            } else {
               bcrypt.compare(password, user.password, function(err, success) {
                  if (err || !success) {
                     return done(null, false, {msg: 'Invalid email or password.'});
                  } else {
                     return done(null, user);
                  }
               });
            }
         });

   }));

   // facebook 
   passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL
   }, function(accessToken, refreshToken, profile, done) {
      model.userDao.handleRemoteUser('facebook', profile._json, function(err, user) {
         if (err) {
            return done(err);
         } else {
            done(null, user);
         }
      });
   }));

   // google 
   passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
   }, function(accessToken, refreshToken, profile, done) {
      model.userDao.handleRemoteUser('google', profile._json, function(err, user) {
         if (err) {
            return done(err);
         } else {
            done(null, user);
         }
      });
   }));

   // serialisation
   passport.serializeUser(function(user, done) {
      done(null, user._id);
   });

   passport.deserializeUser(function(id, done) {
      model.userDao.getUserById(id, function(err, user) {
         done(err, user);
      });
   });
}
