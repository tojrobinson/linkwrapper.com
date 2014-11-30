'use strict';

var config = require('r/config/settings');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

var opt = {
   auto_reconnect: true,
   native_parser: true,
   poolSize: 5
};

module.exports = {
   mongoID: function(id) {
     try {
         return ObjectID(id);
      } catch (e) {
         return null;
      }
   },

   connect: function(url, cb) {
      mongodb
      .MongoClient
      .connect(url, opt, function(err, db) {
         if (err) {
            return cb(err);
         }
         console.log('Connected to mongodb via: ' + url);

         // export access to collections
         module.exports.users = db.collection(config.schema.users);
         module.exports.users.ensureIndex({
            email: 1,
            type: 1,
            remoteId: 1
         }, { unique: true, sparse: true }, function(err) {
            if (err) {
               console.log('Error creating email index.');
            }
         });

         module.exports.links = db.collection(config.schema.links);
         module.exports.links.ensureIndex({
            owner: 1,
            url: 1
         }, { unique: true }, function(err) {
            if (err) {
               console.log('Error creating link index.');
            }
         });

         module.exports.categories = db.collection(config.schema.categories);
         module.exports.playlists = db.collection(config.schema.playlists);
         return cb(null);
      });
   }
};
