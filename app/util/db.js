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
      if (!id) return id;

      try {
         return new ObjectID(id);
      } catch (e) {
         return null;
      }
   },

   connect: function(url, env, cb) {
      if (env === 'testing') {
         console.log('[warning] using test collections');
         config.schema.users = 'test_users';
         config.schema.links = 'test_links';
         config.schema.categories = 'test_categories';
         config.schema.playlists = 'test_playlists';
      }

      mongodb
      .MongoClient
      .connect(url, opt, function(err, db) {
         if (err) {
            return cb(err);
         }

         var users = db.collection(config.schema.users);
         var links = db.collection(config.schema.links);
         var categories = db.collection(config.schema.categories);
         var playlists = db.collection(config.schema.playlists);

         // unique users
         users.ensureIndex({
            type: 1,
            email: 1,
            remoteId: 1
         }, { unique: true, sparse: true }, function(err) {
            if (err) {
               console.log('Error creating email index.');
               throw err;
            }
         });

         // getLinks query + unique library URLs
         links.ensureIndex({
            owner: 1,
            url: 1
         }, { unique: true }, function(err) {
            if (err) {
               console.log('Error creating unique link index.');
               throw err;
            }
         });

         // getLinks query
         links.ensureIndex({
            category: 1
         }, function(err) {
            if (err) {
               console.log('Error creating category link index.');
               throw err;
            }
         });

         // getUserLists query
         categories.ensureIndex({owner: 1}, function(err) {
            if (err) {
               console.log('Error creating owner index for categories.');
               throw err;
            }
         });

         // getUserLists query
         playlists.ensureIndex({owner: 1}, function(err) {
            if (err) {
               console.log('Error creating owner index for playlists.');
               throw err;
            }
         });

         // export access to collections
         module.exports.users = users;
         module.exports.links = links;
         module.exports.categories = categories;
         module.exports.playlists = playlists;

         console.log('Connected to db via: ' + url);
         return cb(null);
      });
   }
};
