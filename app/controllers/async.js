'use strict';

var model = require('r/app/model');
var d = require('r/app/views/dialogues');
var log = require('r/app/util/log');
var parseLink = require('link-id');

var MAX_CATEGORIES = 10;
var MAX_PLAYLISTS = 50;

module.exports = {
   category: function(req, res) {
      var id = req.query.id;
      var modified = req.query.m && new Date(req.query.m);
      var userId = req.user._id;

      var getLinks = function() {
         model.linkDAO.getLinks({
            owner: userId,
            category: id 
         }, function(err, links) {
            if (err) {
               log.error({req: req, err: err});

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

      model.listDAO.getModified('category', id, function(err, category) {
         if (err) {
            log.error({req: req, err: err});
         }

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

      model.listDAO.getList('playlist', id, function(err, playlist) {
         if (err) {
            log.error({req: req, err: err});
         }

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
         model.linkDAO.getLinks(ids, function(err, links) {
            if (err) {
               log.error({req: req, err: err});
               return res.json(d.pack({code: d.ERROR}));
            }

            if (!links) {
               return res.json(d.pack({
                  code: d.SUCCESS,
                  data: []
               }));
            }

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
               model.listDAO.editPlaylist(playlist._id, {links: editList}, function() {
                  // silent to user
               });
            }

            res.json(d.pack({
               code: d.SUCCESS,
               data: renderList
            }));
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

      model.userDAO.getUser({_id: req.user._id}, function(err, user) {
         if (err) {
            log.error({req: req, err: err});
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
      model.userDAO.getUserLists(req.user._id, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         res.json(d.pack(result));
      });
   },

   addLink: function(req, res) {
      var body = req.body;
      var info = parseLink(body.url);
      var owner = req.user._id;
      var url = body.url;

      if (!info) {
         return res.json(d.pack({code: 110}));
      }

      var link = {
         category: body.category,
         owner: owner,
         url: body.url,
         title: body.title,
         artist: body.artist,
         other: body.other,
         playCount: 0,
         dateAdded: new Date()
      };

      model.linkDAO.addLink(link, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (result.code === 111) {
            model.linkDAO.getCategory({
               owner: owner,
               url: url
            }, function(err, category) {
               if (err) {
                  log.error({req: req, err: err});
               }

               result.data = {
                  category: category && category.name || 'LIBRARY'
               };

               res.json(d.pack(result));
            });
         } else if (result.code >= d.ERROR) {
            res.json(d.pack(result));
         } else {
            model.listDAO.modified('category', body.category, function(err) {
               if (err) {
                  log.error({req: req, err: err});
               }

               res.json(d.pack(result));
            });
         }
      });
   },

   addManyLinks: function(req, res) {
      req.body.owner = req.user._id;

      model.linkDAO.addManyLinks(req.body, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (!result.data || result.data.inserted < 1) {
            return res.json(d.pack(result));
         }

         model.listDAO.modified('category', req.body.category, function(err) {
            if (err) {
               log.error({req: req, err: err});
            }

            res.json(d.pack(result));
         });
      });
   },

   addToPlaylist: function(req, res) {
      var links = req.body.links || [];
      var id = req.body.id;

      model.listDAO.addToPlaylist(id, links, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (!result.data || result.data.added < 1) {
            return res.json(d.pack(result));
         }

         model.listDAO.modified('playlist', id, function(err) {
            if (err) {
               log.error({req: req, err: err});
            }

            res.json(d.pack(result));
         });
      });
   },

   removeFromPlaylist: function(req, res) {
      var positions = req.body.positions || [];
      var id = req.body.id;

      model.listDAO.removeFromPlaylist(id, positions, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (result.code !== 12) {
            return res.json(d.pack(result));
         }

         model.listDAO.modified('playlist', id, function(err) {
            if (err) {
               log.error({req: req, err: err});
            }

            res.json(d.pack(result));
         });
      });
   },

   deleteLinks: function(req, res) {
      var linkIds = req.body.linkIds;
      var from = req.body.from;

      model.linkDAO.deleteLinks(linkIds, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (result.code === d.ERROR) {
            return res.json(d.pack(result));
         }

         // cascade delete may have made playlist cache stale
         model.listDAO.clearPlaylistCache(req.user._id);
         model.listDAO.modified('category', from, function(err) {
            if (err) {
               log.error({req: req, err: err});
            }

            res.json(d.pack(result));
         });
      });
   },

   addList: function(req, res) {
      var list = req.body.list;
      var type = req.body.type;

      if (!list || (type !== 'category' && type !== 'playlist')) {
         return res.sendStatus(422);
      }

      list.owner = req.user._id;

      model.userDAO.getUserLists(list.owner, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         var ul = result.data;

         if (ul && ul.categories.length >= MAX_CATEGORIES) {
            return res.json(d.pack({
               code: 129,
               data: {
                  type: 'collections',
                  max: MAX_CATEGORIES
               }
            }));
         }

         if (ul && ul.playlists.length >= MAX_PLAYLISTS) {
            return res.json(d.pack({
               code: 129,
               data: {
                  type: 'playlists',
                  max: MAX_PLAYLISTS
               }
            }));
         }

         model.listDAO.addList(type, list, function(err, result) {
            if (err) {
               log.error({req: req, err: err});
            }

            res.json(d.pack(result));
         });
      });
   },

   deleteLists: function(req, res) {
      var update = 'Library';
      var type = req.body.type;
      var owner = req.user._id;
      var ids = req.body.ids;

      if (type === 'category') {
         model.listDAO.deleteCategories(owner, ids, function(err, result) {
            if (err) {
               log.error({req: req, err: err});
            }

            // cascade delete may have made playlist cache stale
            model.listDAO.clearPlaylistCache(req.user._id);

            res.json(d.pack(result));
         });
      } else if (type === 'playlist') {
         update = 'Playlists';
         model.listDAO.deletePlaylists(owner, ids, function(err, result) {
            if (err) {
               log.error({req: req, err: err});
            }

            res.json(d.pack(result));
         });
      } else {
         res.sendStatus(422);
      }
   },

   editLists: function(req, res) {
      var type = req.body.type;
      var update = 'Library';
      if (type === 'playlists') {
         update = 'Playlists';
      }

      model.listDAO.editLists({
         type: type,
         lists: req.body.lists
      }, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         result.data = {
            update: update
         };
         res.json(d.pack(result));
      });
   },

   syncPlaylist: function(req, res) {
      var playlist = req.body.playlist;
      var links = req.body.links;
      model.listDAO.syncPlaylist(playlist, links, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         model.listDAO.modified('playlist', playlist, function(err) {
            if (err) {
               log.error({req: req, err: err});
            }

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

      model.linkDAO.editLink(linkId, req.body, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         if (result && result.code === 111) {
            return model.linkDAO.getCategory({
               owner: req.user._id,
               url: req.body.url
            }, function(err, category) {
               if (err) {
                  log.error({req: req, err: err});
               }

               result.data = {
                  category: category && category.name || 'LIBRARY'
               };

               res.json(d.pack(result));
            });
         }

         model.listDAO.modified('category', req.body.category, function(err) {
            if (err) {
               log.error({req: req, err: err});
            }

            res.json(d.pack(result));
         });
      });
   },

   editUser: function(req, res) {
      var edit = req.body;
      var userId = req.user._id;

      if (req.user.type === 'guest') {
         return res.json(d.pack({code: 140}));
      }

      model.userDAO.editUser(userId, edit, function(err, result) {
         if (err) {
            log.error({req: req, err: err});
         }

         res.json(d.pack(result));
      });
   },

   addPlay: function(req, res) {
      var linkId = req.body._id;

      model.linkDAO.addPlay(linkId, function(err) {
         if (err) {
            if (err) {
               log.error({req: req, err: err});
            }

            res.send('failure');
         } else {
            res.send('success');
         }
      });
   }
};
