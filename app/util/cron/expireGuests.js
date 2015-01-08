#!/usr/local/bin/node

// use existing indexes to find and expire guest data

var client = require('mongodb').MongoClient;
var config = require('r/config/settings');
var emitter = new (require('events').EventEmitter);
var bulk = {};
var results = {};
var done = 0;
var removed = 0;

function runBulk(op) {
   try {
      bulk[op].execute(function(err, report) {
         if (err) {
            console.error(err);
         }

         if (report) {
            removed += report.nRemoved;
            results[op] = results[op] || 0;
            results[op] += report.nRemoved;
         }

         emitter.emit('done');
      });
   } catch(e) {
      // empty bulk op
      emitter.emit('done');
   }
}

client.connect(config.dbURL, function(err, db) {
   var users = db.collection(config.schema.users);
   var links = db.collection(config.schema.links);
   var categories = db.collection(config.schema.categories);
   var playlists = db.collection(config.schema.playlists);
   var time = new Date();

   bulk.users = users.initializeUnorderedBulkOp();
   bulk.links = links.initializeUnorderedBulkOp();
   bulk.categories = categories.initializeUnorderedBulkOp();
   bulk.playlists = playlists.initializeUnorderedBulkOp();

   emitter.on('done', function() {
      if (++done === 4) {
         if (removed) {
            console.log(new Date() + ': removed guest data: ', results);
         }

         db.close();
      }
   });

   users.find({
      expire: {$lt: time}
   }).toArray(function(err, guests) {
      guests.forEach(function(g) {
         bulk.links.find({owner: g._id}).remove();
         bulk.categories.find({owner: g._id}).remove();
         bulk.playlists.find({owner: g._id}).remove();
         bulk.users.find({_id: g._id}).remove();
      });

      runBulk('links');
      runBulk('categories');
      runBulk('playlists');
      runBulk('users');
   });
});
