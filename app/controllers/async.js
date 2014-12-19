'use strict';

var model = require('r/app/model');
var d = require('r/app/views/dialogues');
var parseLink = require('link-id');

module.exports = {
   category: function(req, res) {
      var id = req.query.id;
      var modified = req.query.m && new Date(req.query.m);
      var userId = req.user;
      var getLinks = function() {
         model.linkDao.getLinks({
            owner: userId,
            category: id 
         }, function(err, links) {
            if (err) {
               res.json(d.pack({code: 115}));
            } else {
               res.json(d.pack({
                  code: d.SUCCESS, 
                  data: links
               }));
            }
         });
      }

      if (!modified) {
         return getLinks();
      }

      model.listDao.getModified('category', id, function(err, category) {
         if (err || !category) {
            return res.json(d.pack({code: 118}));
         }

         if (category.modified <= modified) {
            // 304
            return res.json({type: 'notmodified'});
         }

         getLinks();
      });
   },

   playlist: function(req, res) {
      var id = req.query.id;
      var modified = req.query.m && new Date(req.query.m);

      model.listDao.getList('playlist', id, function(err, playlist) {
         if (err || !playlist) {
            return res.json(d.pack({code: d.ERROR}));
         }

         if (modified && playlist.modified < modified) {
            // 304
            return res.json({type: 'notmodified'});
         }

         var ids = [];
         
         playlist.links.forEach(function(item) {
            ids.push(item.link);
         });

         if (!ids.length) {
            return res.json(d.pack({
               code: d.SUCCESS,
               data: []
            }));
         }

         // join links to ref
         model.linkDao.getLinks(ids, function(err, links) {
            if (err) {
               req.json(err);
            } else {
               var docMap = {};
               var index = 1;
               var editList = [];
               var renderList = [];

               links.forEach(function(link) {
                  docMap[link._id] = link;
               });

               playlist.links.forEach(function(item) {
                  var linkData = docMap[item.link];

                  if (linkData) {
                     renderList.push({
                        link: linkData,
                        order: index
                     });

                     editList.push({
                        link: item.link,
                        order: index++
                     });
                  }
               });

               // lazy cascade delete
               if (editList.length < playlist.links.length) {
                  model.listDao.editPlaylist(playlist._id, {links: editList}, function() {
                     // silent to user
                  });
               }

               res.json(d.pack({
                  code: d.SUCCESS,
                  data: renderList
               }));
            }
         });
      });
   },

   getUser: function(req, res) {
      var projection = {
         display: 1,
         type: 1,
         email: 1,
         settings: 1
      };

      model.userDao.getUser({_id: req.user}, function(err, user) {
         if (err) {
            res.json({type: 'error'});
         } else {
            res.json(d.pack({
               code: d.SUCCESS,
               data: user
            }));
         }
      }, projection);
   },

   getUserLists: function(req, res) {
      model.userDao.getUserLists(req.user, function(err, result) {
         if (result.data) {
            result.data = {
               categories: data.categories,
               playlists: data.playlists
            };
         }

         res.json(d.pack(result));
      });
   },

   addLink: function(req, res) {
      var body = req.body;
      var info = parseLink(body.url);

      if (!info) {
         return res.json(d.pack({code: 110}));
      }

      var link = {
         category: body.category,
         owner: req.user,
         url: body.url,
         title: body.title,
         artist: body.artist,
         other: body.other,
         playCount: 0,
         dateAdded: new Date()
      };

      model.linkDao.addLink(link, function(err, result) {
         model.listDao.modified('category', body.category, function(err) {
            res.json(d.pack(result));
         });
      });
   },

   addToPlaylist: function(req, res) {
      var links = req.body.links || [];
      var id = req.body.id;

      model.listDao.addToPlaylist(id, links, function(err, result) {
         model.listDao.modified('playlist', id, function(err) {
            res.json(d.pack(result));
         });
      });
   },

   removeFromPlaylist: function(req, res) {
      var positions = req.body.positions;
      var id = req.body.id;

      model.listDao.removeFromPlaylist(id, positions, function(err, result) {
         model.listDao.modified('playlist', id, function(err) {
            res.json(d.pack(result));
         });
      });
   },

   deleteLinks: function(req, res) {
      var linkIds = req.body.linkIds;
      var from = req.body.from;

      model.linkDao.deleteLinks(linkIds, function(err, result) {
         // cascade delete may have made playlist cache stale
         model.listDao.clearPlaylistCache(req.user);
         model.listDao.modified('category', from, function(err) {
            res.json(d.pack(result));
         });
      });
   },

   addList: function(req, res) {
      var list = req.body.list;
      var type = req.body.type;
      list.owner = req.user;

      model.listDao.addList(type, list, function(err, result) {
         res.json(d.pack(result));
      });
   },

   deleteLists: function(req, res) {
      var update = 'Library';
      var type = req.body.type;
      var owner = req.user;
      var ids = req.body.ids;

      if (type === 'category') {
         model.listDao.deleteCategories(owner, ids, function(err, result) {
            res.json(d.pack(result));
         });
      } else if (type === 'playlist') {
         update = 'Playlists';
         model.listDao.deletePlaylists(owner, ids, function(err, result) {
            res.json(d.pack(result));
         });
      }
   },

   editLists: function(req, res) {
      var type = req.body.type;
      var update = 'Library';
      if (type === 'playlists') {
         update = 'Playlists';
      }

      model.listDao.editLists({
         type: type,
         lists: req.body.lists
      }, function(err, result) {
         result.data = {
            update: update
         };
         res.json(d.pack(result));
      });
   },

   syncPlaylist: function(req, res) {
      var playlist = req.body.playlist;
      var links = req.body.links;
      model.listDao.syncPlaylist(playlist, links, function(err, result) {
         model.listDao.modified('playlist', playlist, function(err) {
            res.json(d.pack(result));
         });
      });
   },

   editLink: function(req, res) {
      var linkId = req.body._id;
      delete req.body._id;
      var info = parseLink(req.body.url);

      if (!info) {
         return res.json(d.pack({code: 110}));
      }

      model.linkDao.editLink(linkId, req.body, function(err, result) {
         model.listDao.modified('category', req.body.category, function(err) {
            res.json(d.pack(result));
         });
      });
   },

   editUser: function(req, res) {
      var edit = req.body;
      var userId = req.user;

      model.userDao.editUser(userId, edit, function(err, result) {
         res.json(d.pack(result));
      });
   },

   addManyLinks: function(req, res) {
      req.body.owner = req.user;
      model.linkDao.addManyLinks(req.body, function(err, result) {
         model.listDao.modified('category', req.body.category, function(err) {
            res.json(d.pack(result));
         });
      });
   },

   addPlay: function(req, res) {
      var linkId = req.body._id;

      model.linkDao.addPlay(linkId, function(err) {
         if (err) {
            res.send('failure');
         } else {
            res.send('success');
         }
      });
   }
};
