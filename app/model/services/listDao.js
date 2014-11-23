'use strict';

var db = require('r/app/util/db');
var config = require('r/config/settings');
var BSON = require('mongodb').BSONPure;

module.exports = {
   deleteLists: function(opt, cb) {
      var criteria = {};
      criteria.owner = BSON.ObjectID(opt.owner);

      if (opt.type === 'category') {
         criteria.category = {$in : opt.lists};
         db.links.remove(criteria, cb);
      } else if (opt.type === 'playlist') {
         criteria.name = {$in : opt.lists};
         db.playlists.remove(criteria, cb);
      }
   },

   renameLists: function(opt, cb) {
      var criteria = {};
      criteria.owner = BSON.ObjectID(opt.owner);

      var bulk = db.links.initializeUnorderedBulkOp();

      opt.lists.forEach(function(list) {
         if (list.to) {
            if (opt.type === 'category') {
               criteria.category = list.from;
               bulk.find(criteria)
                   .update({$set: {category: list.to}},
                           {multi: true});
            } else if (opt.type === 'playlist') {
               criteria.name = list.from;
               bulk.find(criteria)
                   .update({$set: {name: list.to}},
                           {multi: true});
            }
         }
      });

      bulk.execute(function(err, report) {
         if (err) {
            cb({
               type: 'error',
               msg: 'There was an error during the renaming of some lists.',
               obj: err
            });
         } else {
            console.log(JSON.stringify(report));
         }
      });
   },

   getPlaylist: function(owner, name, cb) {
      db.playlists.find({
         owner: BSON.ObjectID(owner),
         name: name
      }, cb);
   }
};
