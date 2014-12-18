'use strict';

var model = require('r/app/model');
var d = require('r/app/views/dialogues');
var parseLink = require('link-id');

module.exports = {
   addPlay: function(req, res) {
      var linkId = req.body._id;

      model.linkDao.addPlay(linkId, function(err) {
         if (err) {
            res.send('failure');
         } else {
            res.send('success');
         }
      });
   },

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
               res.json(d.pack(115));
            } else {
               res.json(d.pack(d.SUCCESS, links));
            }
         });
      }

      if (!modified) {
         return getLinks();
      }

      model.listDao.getModified('category', id, function(err, category) {
         if (err || !category) {
            return res.json(d.pack(118));
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
            return res.json(d.pack(d.ERROR));
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
            return res.json(d.pack(d.SUCCESS, []));
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
                  model.listDao.editPlaylist(playlist._id, {links: editList}, function(code, data) {
                     // silent to user
                  });
               }

               res.json(d.pack(d.SUCCESS, renderList));
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
            res.json(d.pack(d.SUCCESS, user));
         }
      }, projection);
   },

   getUserLists: function(req, res) {
      model.userDao.getUserLists(req.user, function(code, data) {
         if (data) {
            data = {
               categories: data.categories,
               playlists: data.playlists
            };
         }

         res.json(d.pack(code, data));
      });
   },

   addLink: function(req, res) {
      var body = req.body;
      var info = parseLink(body.url);

      if (!info) {
         return res.json(d.pack(110));
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

      model.linkDao.addLink(link, function(code, data) {
         model.listDao.modified('category', body.category, function(err) {
            res.json(d.pack(code, data));
         });
      });
   },

   addToPlaylist: function(req, res) {
      var links = req.body.links || [];
      var id = req.body.id;

      model.listDao.addToPlaylist(id, links, function(code, data) {
         model.listDao.modified('playlist', id, function(err) {
            res.json(d.pack(code, data));
         });
      });
   },

   removeFromPlaylist: function(req, res) {
      var positions = req.body.positions;
      var id = req.body.id;

      model.listDao.removeFromPlaylist(id, positions, function(code, data) {
         model.listDao.modified('playlist', id, function(err) {
            res.json(d.pack(code, data));
         });
      });
   },

   deleteLinks: function(req, res) {
      var linkIds = req.body.linkIds;
      var from = req.body.from;

      model.linkDao.deleteLinks(linkIds, function(code, data) {
         model.listDao.modified('category', from, function(err) {
            res.json(d.pack(code, data));
         });
      });
   },

   addList: function(req, res) {
      var list = req.body.list;
      var type = req.body.type;
      list.owner = req.user;

      model.listDao.addList(type, list, function(code, data) {
         res.json(d.pack(code, data));
      });
   },

   deleteLists: function(req, res) {
      var update = 'Library';
      var type = req.body.type;
      var owner = req.user;
      var ids = req.body.ids;

      if (type === 'category') {
         model.listDao.deleteCategories(owner, ids, function(err) {
            if (err) {
               res.json(err);
            } else {
               res.json(d.pack(d.SUCCESS));
            }
         });
      } else if (type === 'playlist') {
         update = 'Playlists';
         model.listDao.deletePlaylists(owner, ids, function(err) {
            if (err) {
               res.json(err);
            } else {
               res.json(d.pack(d.SUCCESS));
            }
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
      }, function(code, data) {
         res.json(d.pack(code, { update: update }));
      });
   },

   syncPlaylist: function(req, res) {
      var playlist = req.body.playlist;
      var links = req.body.links;
      model.listDao.syncPlaylist(playlist, links, function(code, data) {
         model.listDao.modified('playlist', playlist, function(err) {
            res.json(d.pack(code, data));
         });
      });
   },

   editLink: function(req, res) {
      var linkId = req.body._id;
      delete req.body._id;
      var info = parseLink(req.body.url);

      if (!info) {
         return res.json(d.pack(110));
      }

      model.linkDao.editLink(linkId, req.body, function(code, data) {
         model.listDao.modified('category', req.body.category, function(err) {
            res.json(d.pack(code, data));
         });
      });
   },

   editUser: function(req, res) {
      var edit = req.body;
      var userId = req.user;

      model.userDao.editUser(userId, edit, function(code, data) {
         res.json(d.pack(code, data));
      });
   },

   addManyLinks: function(req, res) {
      req.body.owner = req.user;
      model.linkDao.addManyLinks(req.body, function(code, data) {
         model.listDao.modified('category', req.body.category, function(err) {
            if (err) {
               console.error(err);
            }
            res.json(d.pack(code, data));
         });
      });
   }
};
