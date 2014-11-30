'use strict';

var model = require('r/app/model');
var dialogues = require('r/app/views/dialogues');
var parseLink = require('link-id');
var multiparty = require('multiparty');

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
      if (user) {
         res.json(dialogues.pack(dialogues.SUCCESS, {
            display: user.display,
            type: user.type,
            email: user.email,
            settings: user.settings
         }));
      } else {
         res.json({type: 'error'});
      }
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
      var links = req.body.links;
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
      var edit = null;
      
      try {
         edit = JSON.parse(req.body.json);
      } catch (e) {
         return res.json(dialogues.pack(130));
      }

      model.userDao.editUser(req.user._id, edit, function(code, data) {
         res.json(dialogues.pack(code, data));
      });
   },

   extract: function(req, res) {
      var form = new multiparty.Form({
         encoding: 'utf8',
         autoFiles: true, 
         maxFilesSize: 1024 * 1024 * 5,
         maxFieldsSize: 1024
      });


      form.parse(req, function(err, fields, files) {
         if (err) {
            if (err.code === 'ETOOBIG') {
               res.json(dialogues.pack(119));
            } else {
               res.json({
                  type: 'error',
                  msg: 'Error reading file.'
               });
            }

         } else {
            var linksFile = files.links && files.links[0];
            var category = fields.category && fields.category[0];

            if (!linksFile || !linksFile.originalFilename.trim()) {
               res.json({
                  type: 'error',
                  msg: 'No file selected.'
               });
            } else if (!category) {
               res.json({
                  type: 'error',
                  msg: 'Invalid collection.'
               });
            } else {
               model.linkDao.extractLinks({
                  userId: req.user._id,
                  category: category,
                  file: linksFile.path
               }, function(code, data) {
                  res.json(dialogues.pack(code, data));
               });
            }
         } 
      });
   }
};
