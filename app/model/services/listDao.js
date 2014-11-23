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

   renameLists: function(opt) {
      var criteria = {};
      criteria.owner = BSON.ObjectID(opt.owner);

      opt.lists.forEach(function(list) {
         if (list.to) {
            if (opt.type === 'category') {
               criteria.category = list.from;
               db.links.update(
                  criteria, 
                  {$set: {category: list.to}},
                  {multi: true},
                  function(err) {
                     if (err) {
                        console.log(err);
                     }
                  }
               );
            } else if (opt.type === 'playlist') {
               criteria.name = list.from;
               db.links.update(
                  criteria, 
                  {$set: {name: list.to}},
                  {multi: true},
                  function(err) {
                     if (err) {
                        console.log(err);
                     }
                  }
               );
            }
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