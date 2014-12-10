'use strict';

var db = require('r/app/util/db');
var sessions = 0;

module.exports = {
   createSession: function(user, cb) {
      // no session data
      db.sessions.insert({_id: user._id}, function(err) {
         if (err) {
            if (err.code === 11000) {
               cb(null);
            } else {
               cb(err);
            }
         } else {
            cb(null);
         }
      });
   },

   getSession: function(id, cb) {
      db.sessions.findOne({
         _id: db.mongoId(id)
      }, {
         display: 1,
         type: 1,
         email: 1,
         settings: 1
      }, function(err, user) {
         if (err) {
            cb(err, user);
         } else if (!user) {
            cb(null, null);
         } else {
            cb(null, user);
         }
      });
   },
   
   destroySession: function(user, cb) {
      if (!user) {
         return cb(new Error('Invalid '))
      }

      db.sessions.remove({_id: user._id}, cb);
   }
};
