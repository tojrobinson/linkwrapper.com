'use strict';

var db = require('r/app/util/db');
var validCategory = require('r/app/model/category');
var validPlaylist = require('r/app/model/playlist');

var PLAYLIST_MAX = 100;
var SUCCESS = 0;

module.exports = {
   addList: function(type, list, cb) {
      db.users.findOne({_id: list.owner}, function(err, user) {
         if (list.order) {
            list.order = parseInt(list.order);
         }

         list.modified = new Date();

         if (type === 'category') {
            if (!user || !validCategory(list)) {
               cb(null, {code: 120});
            }

            db.categories.insert(list, function(err, newList) {
               if (err || !newList) {
                  console.log(err);
                  cb(err, {code: 120});
               } else {
                  cb(null, {
                     code: SUCCESS,
                     data: { id: newList[0]._id }
                  });
               }
            });
         } else if (type === 'playlist') {
            list.links = [];
            list.isPublic = false;

            if (!user || !validPlaylist(list)) {
               cb(null, {code: 121});
            }

            db.playlists.insert(list, function(err, newList) {
               if (err) {
                  cb(err, {code: 121});
               } else {
                  cb(null, {
                     code: SUCCESS,
                     data: { id: newList[0]._id }
                  });
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

   modified: function(type, id, cb) {
      if (type !== 'category' && type !== 'playlist') {
         return process.nextTick(function() {
            cb(new Error('Invalid list type'));
         });
      }

      var listId = db.mongoId(id);
      var update = {
         modified: new Date()
      };

      if (type === 'category') {
         db.categories.update({
            _id: listId
         }, {
            $set: update
         }, cb)
      } else if (type === 'playlist') {
         db.playlists.update({
            _id: listId
         }, {
            $set: update
         }, cb);
      }
   },

   clearPlaylistCache: function(owner, cb) {
      db.playlists.update({
         owner: owner
      }, {
         $set: {
            modified: new Date()
         }
      }, {
         multi: true
      }, function(err) {
         if (cb) {
            cb(err);
         }
      });
   },

   getModified: function(type, id, cb) {
      if (type === 'category') {
         db.categories.findOne({
            _id: db.mongoId(id)
         }, {
            modified: 1,
            _id: 0
         }, cb);
      } else if (type === 'playlist') {
         db.playlists.findOne({
            _id: db.mongoId(id) }, {
            modified: 1,
            _id: 0
         }, cb);
      }
   },

   addToPlaylist: function(id, links, cb) {
      db.playlists.findOne({_id: db.mongoId(id)}, function(err, playlist) {
         if (err) {
            return cb(err, {code: 126});
         }

         if (!playlist) {
            return cb(null, {code: 119});
         }

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
               return cb(err, {code: 122});
            } 

            if (maxList) {
               return cb(null, {
                  code: 123,
                  data: {
                     name: playlist.name,
                     max: PLAYLIST_MAX,
                     added: added
                  }
               });
            }

            cb(null, {
               code: 11,
               data: {
                  added: added,
                  playlist: playlist.name,
                  plural: (added > 1) ? 's' : ''
               }
            });
         });
      });
   },

   removeFromPlaylist: function(id, positions, cb) {
      db.playlists.findOne({_id: db.mongoId(id)}, function(err, playlist) {
         if (err) {
            return cb(err, {code: 126});
         }

         if (!playlist) {
            return cb(null, {code: 119});
         }

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
               return cb(err, {code: 126});
            }

            cb(null, {
               code: 12,
               data: {
                  removed: removed,
                  playlist: playlist.name
               }
            });
         });
      });
   },

   editPlaylist: function(id, edit, cb) {
      db.playlists.findOne({_id: db.mongoId(id)}, function(err, playlist) {
         if (err) {
            return cb(err, {code: 124});
         }

         for (var field in edit) {
            playlist[field] = edit[field]; 
         }

         if (validPlaylist(playlist)) {
            db.playlists.save(playlist, function(err) {
               if (err) {
                  return cb(err, {code: 124});
               }

               cb(null, {code: SUCCESS});
            });
         } else {
            cb(null, {code: 124});
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
               return cb(err, {code: 125});
            }

            db.categories.remove({
               _id: {$in : ids}
            }, function(err) {
               if (err) {
                  return cb(err, {code: 125});
               }

               cb(null, {code: SUCCESS});
            });
         });
      } catch (e) {
         process.nextTick(function() {
            cb(e, {code: 125});
         });
      }
   },

   deletePlaylists: function(owner, ids, cb) {
      ids = ids.map(db.mongoId);
      db.playlists.remove({
         owner: db.mongoId(owner),
         _id: {$in : ids}
      }, function(err) {
         if (err) {
            return cb(err, {code: 125});
         }

         cb(null, {code: SUCCESS});
      });
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
               return cb(err, {code: 126});
            }

            cb(null, {
               code: 20,
               data: report
            });
         });
      } catch (e) {
         process.nextTick(function() {
            if (!valid) {
               return cb(e, {code: 126});
            }

            cb(e, {code: 20});
         });
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
         if (err) {
            return cb(err, {code: 126});
         }

         if (!playlist) {
            return cb(null, {code: 119});
         }

         playlist.links = links;

         if (validPlaylist(playlist)) {
            db.playlists.save(playlist, function(err) {
               if (err) {
                  return cb(err, {
                     code: 128,
                     data: {
                        playlist: playlist.name
                     }
                  });
               }

               cb(null, {code: SUCCESS});
            });
         } else {
            process.nextTick(function() {
               cb(null, {
                  code: 128,
                  data: {
                     playlist: playlist.name
                  }
               });
            });
         }
      });
   }
};
