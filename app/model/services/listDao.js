'use strict';

var db = require('r/app/util/db');
var config = require('r/config/settings');
var BSON = require('mongodb').BSONPure;
var validCategory = require('r/app/model/category');
var validPlaylist = require('r/app/model/playlist');
var validLink = require('r/app/model/link');

var PLAYLIST_MAX = 300;

module.exports = {
   addList: function(type, list, cb) {
      list.order = parseInt(list.order);
      if (type === 'category') {
         if (!validCategory(list, true)) {
            return cb({
               type: 'error',
               msg: 'Unable to create collection.'
            });
         }

         db.categories.insert(list, function(err, newList) {
            if (err || !newList) {
               cb({
                  type: 'error',
                  msg: 'Unable to create collection.'
               });
            } else {
               cb(null, newList[0]._id);
            }
         });
      } else if (type === 'playlist') {
         list.links = [];
         list.isPublic = false;

         if (!validPlaylist(list, true)) {
            return cb({
               type: 'error',
               msg: 'Unable to create playlist.'
            });
         }

         db.playlists.insert(list, function(err, newList) {
            if (err) {
               cb({
                  type: 'error',
                  msg: 'Unable to create playlist.'
               });
            } else {
               cb(null, newList[0]._id);
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
      db.playlists
        .find({_id: BSON.ObjectId(id)}, function(err, playlist) {
         var next = playlist.links.length;
         var maxList = false;

         links.forEach(function(link) {
            link.order = next++;
            if (next <= PLAYLIST_MAX) {
               playlist.links.push(link);
            } else {
               maxList = true;
            }
         });

         db.playlists.save(playlist, function(err) {
            if (err) {
               cb({
                  type: 'error',
                  msg: 'Some of the links could not be added to the playlist.'
               });
            } else {
               if (maxList) {
                  cb({msg: 'Max playlist length reached.'});
               } else {
                  cb(null);
               }
            }
         });
      });
   },

   deleteCategories: function(owner, ids, cb) {
      var bulk = db.links.initializeUnorderedBulkOp();
      var ids = ids.map(BSON.ObjectID);

      ids.forEach(function(category) {
         bulk.find({
            owner: BSON.ObjectID(owner),
            category: BSON.ObjectID(category)
         }).remove();
      });

      bulk.execute(function(err) {
         if (err) {
            cb({
               type: 'error',
               msg: 'An error occurred during the deletion of some lists.'
            });
         } else {
            db.categories.remove({
               _id: {$in : ids}
            }, function(err) {
               if (err) {
                  cb({
                     type: 'error',
                     msg: 'An error occurred during the deletion of some lists.'
                  });
               } else {
                  cb(null);
               }
            });
         }
      });
   },

   deletePlaylists: function(owner, ids, cb) {
      var ids = ids.map(BSON.ObjectID);
      db.playlists.remove({
         owner: BSON.ObjectID(owner),
         _id: {$in : ids}
      }, cb);
   },

   editLists: function(opt, cb) {
      var valid = true;

      if (opt.type === 'category') {
         var bulk = db.categories.initializeUnorderedBulkOp();
         opt.lists.forEach(function(list) {
            list.id = BSON.ObjectID(list.id);
            list.order = parseInt(list.order);

            if (validCategory(list, {sparse: true})) {
               db.find({_id: list.id}).updateOne({
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
         var bulk = db.playlists.initializeUnorderedBulkOp();
         opt.lists.forEach(function(list) {
            list.id = BSON.ObjectID(list.id);
            list.order = parseInt(list.order);

            if (!validPlaylist(list, {sparse: true})) {
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
               cb({
                  type: 'error',
                  msg: 'An an error occurred during the renaming of some lists.',
                  obj: err
               });
            } else {
               cb(null);
            }
         });
      } catch (e) {
         if (valid) {
            cb({
               type: 'error',
               msg: 'One or more lists could not be updated.'
            });
         } else {
            cb(null);
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
