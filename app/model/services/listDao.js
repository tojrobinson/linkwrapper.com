'use strict';

var db = require('r/app/util/db');
var BSON = require('mongodb').BSONPure;
var validCategory = require('r/app/model/category');
var validPlaylist = require('r/app/model/playlist');

var PLAYLIST_MAX = 300;
var SUCCESS = 0;

module.exports = {
   addList: function(type, list, cb) {
      list.order = parseInt(list.order);
      if (type === 'category') {
         if (!validCategory(list)) {
            return cb(120);
         }

         db.categories.insert(list, function(err, newList) {
            if (err || !newList) {
               cb(120);
            } else {
               cb(SUCCESS, { id: newList[0]._id });
            }
         });
      } else if (type === 'playlist') {
         list.links = [];
         list.isPublic = false;

         if (!validPlaylist(list)) {
            return cb(121);
         }

         db.playlists.insert(list, function(err, newList) {
            if (err) {
               cb(121);
            } else {
               cb(SUCCESS, { id: newList[0]._id });
            }
         });
      }
   },

   getList: function(type, id, cb) {
      if (type === 'category') {
         db.categories.findOne({_id: BSON.ObjectID(id)}, cb);
      } else if (type === 'playlist') {
         db.playlists.findOne({_id: BSON.ObjectID(id)}, cb);
      }
   },

   addToPlaylist: function(id, links, cb) {
      db.playlists.findOne({_id: BSON.ObjectID(id)}, function(err, playlist) {
         var next = playlist.links.length + 1;
         var added = 0;
         var maxList = false;

         links.forEach(function(link) {
            link = {
               link: BSON.ObjectID(link),
               order: next
            };

            if (next++ <= PLAYLIST_MAX) {
               added++;
               playlist.links.push(link);
            } else {
               maxList = true;
            }
         });

         db.playlists.save(playlist, function(err) {
            if (err) {
               cb(122);
            } else {
               if (maxList) {
                  cb(123, {playlist: playlist.name});
               } else {
                  cb(11, {
                     added: added,
                     playlist: playlist.name,
                     plural: (added > 1) ? 's' : ''
                  });
               }
            }
         });
      });
   },

   deleteCategories: function(owner, ids, cb) {
      var bulk = db.links.initializeUnorderedBulkOp();
      ids = ids.map(BSON.ObjectID);

      ids.forEach(function(category) {
         bulk.find({
            owner: BSON.ObjectID(owner),
            category: BSON.ObjectID(category)
         }).remove();
      });

      bulk.execute(function(err) {
         if (err) {
            cb(125);
         } else {
            db.categories.remove({
               _id: {$in : ids}
            }, function(err) {
               if (err) {
                  cb(125);
               } else {
                  cb(SUCCESS);
               }
            });
         }
      });
   },

   deletePlaylists: function(owner, ids, cb) {
      ids = ids.map(BSON.ObjectID);
      db.playlists.remove({
         owner: BSON.ObjectID(owner),
         _id: {$in : ids}
      }, cb);
   },

   editLists: function(opt, cb) {
      var valid = true;
      var bulk = null;

      if (opt.type === 'category') {
         bulk = db.categories.initializeUnorderedBulkOp();
         opt.lists.forEach(function(list) {
            list.id = BSON.ObjectID(list.id);
            list.order = parseInt(list.order);

            if (validCategory(list, {sparse: true})) {
               bulk.find({_id: list.id}).updateOne({
                  $set: {
                     name: list.name,
                     order: list.order
                  }
               });
            } else {
               valid = false;
            }
         });
      } else if (opt.type === 'playlist') {
         bulk = db.playlists.initializeUnorderedBulkOp();
         opt.lists.forEach(function(list) {
            list.id = BSON.ObjectID(list.id);
            list.order = parseInt(list.order);

            if (validPlaylist(list, {sparse: true})) {
               bulk.find({_id: list.id}).updateOne({
                  $set: {
                     name: list.name,
                     order: list.order
                  }
               });
            } else {
               valid = false;
            }
         });
      }

      try {
         bulk.execute(function(err, report) {
            if (err) {
               cb(126);
            } else {
               cb(20, report);
            }
         });
      } catch (e) {
         if (!valid) {
            cb(126);
         } else {
            cb(20);
         }
      }
   },

   getPlaylist: function(owner, name, cb) {
      db.playlists.find({
         owner: BSON.ObjectID(owner),
         name: name
      }, cb);
   }
};
