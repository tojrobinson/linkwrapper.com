'use strict';

var db = require('r/app/util/db');
var validCategory = require('r/app/model/category');
var validPlaylist = require('r/app/model/playlist');

var PLAYLIST_MAX = 200;
var SUCCESS = 0;

module.exports = {
   addList: function(type, list, cb) {
      db.users.findOne({_id: list.owner}, function(err, user) {
         if (list.order) {
            list.order = parseInt(list.order);
         }

         if (type === 'category') {
            if (!user || !validCategory(list)) {
               return cb(120);
            }

            db.categories.insert(list, function(err, newList) {
               if (err || !newList) {
                  console.log(err);
                  cb(120);
               } else {
                  cb(SUCCESS, { id: newList[0]._id });
               }
            });
         } else if (type === 'playlist') {
            list.links = [];
            list.isPublic = false;

            if (!user || !validPlaylist(list)) {
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
      });
   },

   getList: function(type, id, cb) {
      if (type === 'category') {
         db.categories.findOne({_id: db.mongoId(id)}, cb);
      } else if (type === 'playlist') {
         db.playlists.findOne({_id: db.mongoId(id)}, cb);
      }
   },

   addToPlaylist: function(id, links, cb) {
      db.playlists.findOne({_id: db.mongoId(id)}, function(err, playlist) {
         var next = playlist.links.length + 1;
         var added = 0;
         var maxList = false;

         links.forEach(function(link) {
            link = {
               link: db.mongoId(link),
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

   removeFromPlaylist: function(id, positions, cb) {
      db.playlists.findOne({_id: db.mongoId(id)}, function(err, playlist) {
         if (err) {
            cb(126);
         } else {
            var newOrder = [];
            var index = 1;
            var removed = 0;

            positions.forEach(function(i) {
               playlist.links[i-1] = null;
            });

            playlist.links.forEach(function(link) {
               if (link) {
                  link.order = index++;
                  newOrder.push(link);
               } else {
                  removed++;
               }
            });

            playlist.links.length = 0;
            playlist.links = newOrder;

            db.playlists.save(playlist, function(err) {
               if (err) {
                  cb(126);
               } else {
                  cb(12, {
                     removed: removed,
                     playlist: playlist.name
                  });
               }
            });
         }
      });
   },

   editPlaylist: function(id, edit, cb) {
      db.playlists.findOne({_id: db.mongoId(id)}, function(err, playlist) {
         if (err) {
            cb(124);
         } else {
            for (var field in edit) {
               playlist[field] = edit[field]; 
            }
         }

         if (validPlaylist(playlist, {debug: true})) {
            db.playlists.save(playlist, function(err) {
               if (err) {
                  cb(124);
               } else {
                  cb(SUCCESS);
               }
            });
         } else {
            cb(124);
         }
      });
   },

   deleteCategories: function(owner, ids, cb) {
      var bulk = db.links.initializeUnorderedBulkOp();
      ids = ids.map(db.mongoId);

      ids.forEach(function(category) {
         bulk.find({
            owner: db.mongoId(owner),
            category: db.mongoId(category)
         }).remove();
      });

      try {
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
      } catch (e) {
         cb(125);
      }
   },

   deletePlaylists: function(owner, ids, cb) {
      ids = ids.map(db.mongoId);
      db.playlists.remove({
         owner: db.mongoId(owner),
         _id: {$in : ids}
      }, cb);
   },

   // list titles in side bar
   editLists: function(opt, cb) {
      var valid = true;
      var bulk = null;

      if (opt.type === 'category') {
         bulk = db.categories.initializeUnorderedBulkOp();
         opt.lists.forEach(function(list) {
            list.id = db.mongoId(list.id);
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
            list.id = db.mongoId(list.id);
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

   syncPlaylist: function(id, links, cb) {
      links = links || [];
      links.forEach(function(l) {
         l.order = parseInt(l.order);
         l.link = db.mongoId(l.link);
      });

      db.playlists.findOne({
         _id: db.mongoId(id)
      }, function(err, playlist) {
         playlist.links = links;

         if (validPlaylist(playlist)) {
            db.playlists.save(playlist, function(err) {
               if (err) {
                  cb(128, {
                     playlist: playlist.name
                  });
               } else {
                  cb(SUCCESS);
               }
            });
         } else {
            cb(128, {
               playlist: playlist.name
            });
         }
      });
   }
};
