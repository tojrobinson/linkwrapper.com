'use strict';

var model = require('r/app/model');
var dialogues = require('r/app/views/dialogues');
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

   category: function(req, res, next) {
      var category = req.query.id;
      var userId = req.user._id;

      model.linkDao.getLinks({
         owner: userId,
         category: category
      }, function(err, links) {
         if (err) {
            res.json(dialogues.pack(115));
         } else {
            if (links.length) {
               res.render('partials/category', {links: links}, function(err, html) {
                  res.json(dialogues.pack(dialogues.SUCCESS, html));
               });
            } else {
               res.json(dialogues.pack(dialogues.SUCCESS));
            }
         }
      });
   },

   playlist: function(req, res) {
      var id = req.query.id;

      model.listDao.getList('playlist', id, function(err, playlist) {
         if (err) {
            req.json(err);
         } else if (playlist && playlist.links.length) {
            var ids = [];
            
            playlist.links.forEach(function(item) {
               ids.push(item.link);
            });

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

                  res.render('partials/playlist', {links: renderList}, function(err, html) {
                     res.json(dialogues.pack(dialogues.SUCCESS, html));
                  });
               }
            });
         } else {
            res.json(dialogues.pack(dialogues.SUCCESS));
         }
      });
   },

   getUser: function(req, res) {
      var user = req.user;
      var projection = {
         display: 1,
         type: 1,
         email: 1,
         settings: 1
      };

      model.userDao.getUser({_id: user._id}, function(err, user) {
         if (err) {
            res.json({type: 'error'});
         } else {
            res.json(dialogues.pack(dialogues.SUCCESS, user));
         }
      }, projection);
   },

   getUserLists: function(req, res) {
      model.userDao.getUserLists(req.user._id, function(code, data) {
         if (data) {
            data = {
               categories: data.categories,
               playlists: data.playlists
            };
         }

         res.json(dialogues.pack(code, data));
      });
   },

   addLink: function(req, res) {
      var body = req.body;
      var info = parseLink(body.url);

      if (!info) {
         return res.json(dialogues.pack(110));
      }

      var link = {
         category: body.category,
         owner: req.user._id,
         url: body.url,
         title: body.title,
         artist: body.artist,
         other: body.other,
         playCount: 0,
         dateAdded: new Date()
      };

      model.linkDao.addLink(link, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   },

   addToPlaylist: function(req, res) {
      var links = req.body.links || [];
      var id = req.body.id;

      model.listDao.addToPlaylist(id, links, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   },

   removeFromPlaylist: function(req, res) {
      var positions = req.body.positions;
      var id = req.body.id;

      model.listDao.removeFromPlaylist(id, positions, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   },

   deleteLinks: function(req, res) {
      var linkIds = req.body.linkIds;
      model.linkDao.deleteLinks(linkIds, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   },

   addList: function(req, res) {
      var list = req.body.list;
      var type = req.body.type;
      list.owner = req.user._id;

      model.listDao.addList(type, list, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   },

   deleteLists: function(req, res) {
      var update = 'Library';
      var type = req.body.type;
      var owner = req.user._id;
      var ids = req.body.ids;

      if (type === 'category') {
         model.listDao.deleteCategories(owner, ids, function(err) {
            if (err) {
               res.json(err);
            } else {
               res.json(dialogues.pack(dialogues.SUCCESS));
            }
         });
      } else if (type === 'playlist') {
         update = 'Playlists';
         model.listDao.deletePlaylists(owner, ids, function(err) {
            if (err) {
               res.json(err);
            } else {
               res.json(dialogues.pack(dialogues.SUCCESS));
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
         res.json(dialogues.pack(code, { update: update }));
      });
   },

   syncPlaylist: function(req, res) {
      var playlist = req.body.playlist;
      var links = req.body.links;
      model.listDao.syncPlaylist(playlist, links, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   },

   editLink: function(req, res) {
      var linkId = req.body.id;
      var info = parseLink(req.body.url);
      delete req.body.id;

      if (!info) {
         return res.json(dialogues.pack(110));
      }

      model.linkDao.editLink(linkId, req.body, function(err) {
         if (err) {
            res.json(err);
         } else {
            res.json({type: 'success'});
         }
      });
   },

   editUser: function(req, res) {
      model.userDao.editUser(req.user._id, req.body, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   },

   addManyLinks: function(req, res) {
      req.body.owner = req.user._id;
      model.linkDao.addManyLinks(req.body, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   }
};
