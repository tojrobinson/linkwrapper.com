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
      var category = req.query.name,
      userId = req.user._id;

      if (!category) {
         return res.render('notifications/loadError', {message: 'invalid cateogry'});
      }

      model.linkDao.getLinks({
         owner: userId,
         category: category.toLowerCase()
      }, function(err, links) {
         if (err) {
            res.render('notifications/loadError');
         } else {
            if (links.length) {
               res.render('partials/listBody', {
                  links: links
               });
            } else {
               res.send('empty');
            }
         }
      });
   },

   playlist: function(req, res) {
      var playlists = req.user.playlists,
      playlistName = req.query.name,
      linkIds = null;

      for (var i = 0; i < playlists.length; ++i) {
         if (playlists[i].name === playlistName) {
            linkIds = playlists[i].links;
         }
      }

      model.listDao.getPlaylist(req.user, name, function(err, ids) {
         model.linkDao.getLinks({linkIds: ids}, function() {
         
         });
      });

      if (linkIds && linkIds.length) {
         model.linkDao.getLinks({
            _id: { $in: linkIds }
         }, function(err, links) {
            if (err) {
               res.render('notifications/loadError');
            } else {
               res.render('partials/listBody', {
                  links: links
               });
            }
         });   
      } else {
         res.send('failure');
      }
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
         url: body.url,
         title: body.title,
         artist: body.artist,
         other: body.other,
         category: body.category,
         mediaType: info.type,
         playCount: 0,
         owner: req.user._id,
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

   deleteLists: function(req, res) {
      model.listDao.deleteLists({
         owner: req.user._id,
         type: req.body.type,
         lists: req.body.lists
      }, function(err) {
         if (err) {
            res.send('failure');
         } else {
            res.send('success');
         }
      });
   },

   renameLists: function(req, res) {
      model.listDao.renameLists({
         owner: req.user._id,
         type: req.body.type,
         lists: req.body.lists
      }, function(err) {
         if (err) {
            res.json(err);
         } else {
            res.send('success');
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
