'use strict';

var model = require('r/app/model');
var parseLink = require('link-id');
var multiparty = require('multiparty');

module.exports = {
   playCount: function(req, res) {
      var linkId = req.body._id;

      model.linkDao.incrementCount(linkId, function(err) {
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
         return res.render('notifications/loadError', {message: 'invalid cateogry'});
      }

      model.linkDao.getLinks({
         owner: userId,
         category: category
      }, function(err, links) {
         if (err) {
            res.json({
               type: 'error',
               msg: err
            });
         } else {
            if (links.length) {
               res.render('partials/category', {links: links}, function(err, html) {
                  res.json({
                     type: 'success',
                     html: html
                  });
               });
            } else {
               res.json({type: 'empty'});
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

            model.linkDao.getLinks(ids, function(err, links) {
               if (err) {
                  req.json(err);
               } else {
                  var docMap = {};

                  links.forEach(function(link) {
                     docMap[link._id] = link;
                  });

                  playlist.links.forEach(function(item) {
                     item.link = docMap[item.link];
                  });

                  res.render('partials/playlist', {links: playlist.links}, function(err, html) {
                     res.json({
                        type: 'success',
                        html: html
                     });
                  });
               }
            });
         } else {
            res.send('empty');
         }
      });
   },

   getUser: function(req, res) {
      var user = req.user;
      if (user) {
         res.json({
            display: user.display,
            type: user.type,
            email: user.email,
            settings: user.settings,
            categories: user.categories,
            playlists: user.playlists
         });
      } else {
         res.json('failure');
      }
   },

   addLink: function(req, res) {
      var body = req.body;
      var info = parseLink(body.url);

      if (!info) {
         return res.json({
            type: 'error',
            msg: 'Unsupported link type'
         });
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

      model.linkDao.addLink(link, function(err, result) {
         if (err) {
            res.json({
               type: 'error',
               msg: err.msg
            });
         } else {
            res.json(link);
         }
      });
   },

   addToPlaylist: function(req, res) {
      var links = req.body.links;
      var id = req.body.id;

      model.listDao.addToPlaylist(id, links, function(err, report) {
         if (err) {
            res.json(err);
         } else {
            res.json(report);
         }
      });
   },

   deleteLinks: function(req, res) {
      var linkIds = req.body.linkIds;
      model.linkDao.deleteLinks(linkIds, function(err) {
         if (err) {
            console.log(err);
            res.send('failure');
         } else {
            res.send('success');
         }
      });
   },

   createList: function(req, res) {
      var name = req.query.name,
      addTo = req.query.addTo;

      if (addTo === 'playlists') {
         model.userDao.addPlaylist(req.user._id, name, function(err) {
            if (err) {
               res.send(err.message);
            } else {
               res.send('success');
            }
         });
      } else if (addTo === 'categories') {
         model.userDao.addCategory(req.user._id, name, function(err) {
            if (err) {
               res.send(err.message);
            } else {
               res.send('success');
            }
         });
      } else {
         res.send('failure');
      }
   },

   addList: function(req, res) {
      var list = req.body.list;
      var type = req.body.type;
      list.owner = req.user._id;

      model.listDao.addList(type, list, function(err, id) {
         if (err) {
            res.json(err);
         } else {
            res.json({
               id: id
            });
         }
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
               res.json({
                  msg: update + ' updated successfully.'
               });
            }
         });
      } else if (type === 'playlist') {
         update = 'Playlists';
         model.listDao.deletePlaylists(owner, ids, function(err) {
            if (err) {
               res.json(err);
            } else {
               res.json({
                  msg: update + ' updated successfully.'
               });
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
      }, function(err) {
         if (err) {
            res.json(err);
         } else {
            res.json({
               msg: update + ' updated successfully.'
            });
         }
      });
   },

   editLink: function(req, res) {
      var linkId = req.body.id;
      var info = parseLink(req.body.url);
      delete req.body.id;

      if (!info) {
         return res.json({
            type: 'error',
            msg: 'Unsupported link type.'
         });
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
      var edit = JSON.parse(req.body.json);

      model.userDao.editUser(req.user._id, edit, function(err) {
         if (err) {
            res.send(err);
         } else {
            res.send('success');
         }
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
            }, function(err, report) {
               if (err) {
                  res.json({
                     type: 'error',
                     msg: err.msg
                  });
               } else {
                  res.json(report);
               }
            });
         }
      });
   }
};
