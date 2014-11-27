'use strict';

var model = require('r/app/model');
var response = require('r/app/views/dialogues');
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

   category: function(req, res) {
      var category = req.query.id;
      var userId = req.user._id;

      if (!category) {
         return res.render('notifications/loadError', {message: 'invalid category'});
      }

      model.linkDao.getLinks({
         owner: userId,
         category: category
      }, function(err, links) {
         if (err) {
            res.json(response.build(115));
         } else {
            if (links.length) {
               res.render('partials/category', {links: links}, function(err, html) {
                  res.json(response.build(response.SUCCESS, html));
               });
            } else {
               res.json(response.build(response.SUCCESS));
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
                        console.log(response.build(code, data));
                     });
                  }

                  res.render('partials/playlist', {links: renderList}, function(err, html) {
                     res.json(response.build(response.SUCCESS, html));
                  });
               }
            });
         } else {
            res.json(response.build(response.SUCCESS));
         }
      });
   },

   getUser: function(req, res) {
      var user = req.user;
      if (user) {
         res.json(response.build(response.SUCCESS, {
            display: user.display,
            type: user.type,
            email: user.email,
            settings: user.settings,
            categories: user.categories,
            playlists: user.playlists
         }));
      } else {
         res.json({type: 'error'});
      }
   },

   addLink: function(req, res) {
      var body = req.body;
      var info = parseLink(body.url);

      if (!info) {
         return res.json(response.build(110));
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
         res.json(response.build(code, data));
      });
   },

   addToPlaylist: function(req, res) {
      var links = req.body.links;
      var id = req.body.id;

      model.listDao.addToPlaylist(id, links, function(code, data) {
         res.json(response.build(code, data));
      });
   },

   removeFromPlaylist: function(req, res) {
      var positions = req.body.positions;
      var id = req.body.id;

      model.listDao.removeFromPlaylist(id, positions, function(code, data) {
         res.json(response.build(code, data));
      });
   },

   deleteLinks: function(req, res) {
      var linkIds = req.body.linkIds;
      model.linkDao.deleteLinks(linkIds, function(err) {
         if (err) {
            res.send('failure');
         } else {
            res.send('success');
         }
      });
   },

   addList: function(req, res) {
      var list = req.body.list;
      var type = req.body.type;
      list.owner = req.user._id;

      model.listDao.addList(type, list, function(code, data) {
         res.json(response.build(code, data));
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
               res.json(response.build(response.SUCCESS));
            }
         });
      } else if (type === 'playlist') {
         update = 'Playlists';
         model.listDao.deletePlaylists(owner, ids, function(err) {
            if (err) {
               res.json(err);
            } else {
               res.json(response.build(response.SUCCESS));
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
         res.json(response.build(code, { update: update }));
      });
   },

   editLink: function(req, res) {
      var linkId = req.body.id;
      var info = parseLink(req.body.url);
      delete req.body.id;

      if (!info) {
         return res.json(response.build(110));
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
         return res.json(response.build(130));
      }

      model.userDao.editUser(req.user._id, edit, function(code, data) {
         res.json(response.build(code, data));
      });
   },

   extract: function(req, res) {
      var form = new multiparty.Form({encoding: 'utf8', maxFileSize: '5MB', maxFieldsSize: 50});
      form.parse(req, function(err, fields, files) {
         if (err) {
            res.json({
               type: 'error',
               msg: 'Error reading file.'
            });
         } else if (!files.links[0].originalFilename.trim()) {
            res.json({
               type: 'error',
               msg: 'No file selected.'
            });
         } else {
            model.linkDao.extractLinks({
               userId: req.user._id,
               category: fields.category[0].toLowerCase(),
               file: files.links[0].path
            }, function(code, data) {
               res.json(response.build(code, data));
            });
         }
      });
   }
};
