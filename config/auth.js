'use strict';

var model = require('r/app/model');
var config = require('./settings');
var bcrypt = require('bcrypt');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var db = require('r/app/util/db');

module.exports = function(passport) {
   // local
   passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
   },
   function(email, password, done) {
      model.userDAO.getUser({email: email.toLowerCase()},
         function(err, user) {
            if (err) {
               return done(err);
            } else if (!user) {
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
      model.userDAO.handleRemoteUser('facebook', profile._json, done);
   }));

   // google 
   passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
   }, function(accessToken, refreshToken, profile, done) {
      model.userDAO.handleRemoteUser('google', profile._json, done);
   }));

   // serialisation
   passport.serializeUser(function(user, done) {
      done(null, {
         _id: user._id,
         type: user.type
      });
   });

   passport.deserializeUser(function(user, done) {
      user._id = db.mongoId(user._id);
      done(null, user);
   });
}
