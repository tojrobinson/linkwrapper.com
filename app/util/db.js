'use strict';

var config = require('r/config/settings');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

var opt = {
   auto_reconnect: true,
   native_parser: true,
   poolSize: 20
};

module.exports = {
   mongoId: function(id) {
      if (!id) {
         return id;
      }

      try {
         return new ObjectID(id);
      } catch (e) {
         return null;
      }
   },

   connect: function(url, env, cb) {
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
         var transactions = db.collection(config.schema.transactions);

         // unique users
         users.ensureIndex({
            remoteId: 1,
            email: 1
         }, {
            unique: true,
            sparse: true
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating unique user index.');
               throw err;
            }
         });

         // expire guests
         // used for cron cleanup
         users.ensureIndex({
            expire: 1
         }, {
            sparse: true
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating expire user index.');
               throw err;
            }
         });

         // local users
         users.ensureIndex({
            email: 1
         }, {
            sparse: true
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating email index.');
               throw err;
            }
         });

         // remote users
         users.ensureIndex({
            remoteId: 1
         }, {
            sparse: true
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating remoteId index.');
               throw err;
            }
         });

         // getLinks query + unique library URLs
         links.ensureIndex({
            owner: 1,
            url: 1
         }, {
            unique: true
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating unique link index.');
               throw err;
            }
         });

         links.ensureIndex({
            owner: 1
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating link owner index.');
               throw err;
            }
         });

         // getLinks query
         links.ensureIndex({
            category: 1
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating link category index.');
               throw err;
            }
         });

         // getUserLists query
         categories.ensureIndex({
            owner: 1
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating owner index for categories.');
               throw err;
            }
         });

         // getUserLists query
         playlists.ensureIndex({
            owner: 1
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating owner index for playlists.');
               throw err;
            }
         });

         // expire old transactions
         transactions.ensureIndex({
            created: 1
         }, {
            expireAfterSeconds: 60 * 60 * 24
         }, function(err) {
            if (err) {
               console.log('[mongodb] Error creating transaction expiration index.');
               throw err;
            }
         });

         // export access to collections
         module.exports.users = users;
         module.exports.links = links;
         module.exports.categories = categories;
         module.exports.playlists = playlists;
         module.exports.transactions = transactions;

         console.log('Connected to db via: ' + url);
         return cb(null);
      });
   }
};
