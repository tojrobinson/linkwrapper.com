'use strict';

var config = require('r/config/settings');
var opt = {
   auto_reconnect: true,
   native_parser: true,
   poolSize: 5
};

module.exports.connect = function(url, cb) {
   require('mongodb')
   .MongoClient
   .connect(url, opt, function(err, db) {
      if (err) {
         return cb(err);
      }
      console.log('Connected to mongodb via: ' + url);

      // export access to collections
      module.exports.users = db.collection(config.schema.users);
      module.exports.links = db.collection(config.schema.links);
      module.exports.playlists = db.collection(config.schema.playlists);
      return cb(null);
   });
}
