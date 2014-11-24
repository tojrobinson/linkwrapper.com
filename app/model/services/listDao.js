'use strict';

var db = require('r/app/util/db');
var config = require('r/config/settings');
var BSON = require('mongodb').BSONPure;
var validCategory = require('r/app/model/category');
var validPlaylist = require('r/app/model/playlist');
var validLink = require('r/app/model/link');

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

         links.forEach(function(link) {
            link.order = next++;
            playlist.links.push(link);
         });

         db.playlists.save(playlist, function(err) {
            if (err) {
               cb({
                  type: 'error',
                  msg: 'Some of the links could not be added to the playlist.'
               });
            } else {
               cb(null);
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

   deletePlaylists: function(opt, cb) {
      ids.map(BSON.ObjectId);
      db.playlists.remove({
         owner: BSON.ObjectID(owner),
         _id: {$in : ids}
      });
   },

   editLists: function(opt, cb) {
      if (opt.type === 'category') {
         var bulk = db.categories.initializeUnorderedBulkOp();
      } else if (opt.type === 'playlist') {
         var bulk = db.playlists.initializeUnorderedBulkOp();
      }

      opt.lists.forEach(function(list) {
         if (list.name) {
            bulk.find({_id: BSON.ObjectID(list.id)}).update({
               $set: {
                  name: list.name,
                  order: parseInt(list.order)
               }
            });
         }
      });


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
   },

   getPlaylist: function(owner, name, cb) {
      db.playlists.find({
         owner: BSON.ObjectID(owner),
         name: name
      }, cb);
   }
};
