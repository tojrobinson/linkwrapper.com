'use strict';

var model = require('r/app/model');
var linkId = require('link-id');
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
            theme: user.settings.theme,
            suggestions: user.settings.suggestions,
            categories: user.categories,
            playlists: user.playlists
         });
      } else {
         res.send('failure');
      }
   },

   addLink: function(req, res) {
      var body = req.body;
      var linkDetails = linkId(body.url);

      if (linkDetails) {
         var link = {
            url: body.url,
            title: body.title,
            artist: body.artist,
            other: body.other,
            category: body.category,
            mediaType: linkDetails.type,
            playCount: 0,
            owner: req.user._id,
            dateAdded: new Date()
         };

         /* d.getUTCFullYear() +
            '-' + ('0' + d.getUTCMonth()).slice(-2) +
            '-' + ('0' + d.getUTCDate()).slice(-2);*/

         model.linkDao.addLink(link, function(err, result) {
            if (err) {
               res.send('failure');
            } else {
               res.json(link);
            }
         });
      } else {
         res.send('failure');
      }
   },

   deleteLinks: function(req, res) {
      var linkIds = req.body.linkIds;
      model.linkDao.deleteById(linkIds, function(err) {
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
            console.log(err);
            res.send('failure');
         } else {
            res.send('success');
         }
      });
   },

   editLink: function(req, res) {
      var linkId = req.body.id;
      delete req.body.id;

      model.linkDao.editLink(linkId, req.body, function(err) {
         if (err) {
            res.send(err.msg);
         } else {
            res.send('success');
         }
      });
   },

   editUser: function(req, res) {
      model.userDao.editUser(req.user._id, req.body, function(err) {
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
            res.send('failure');
         } else if (!files.links[0].originalFilename.trim()) {
            res.send('failure');
         } else {
            model.linkDao.extractLinks({
               userId: req.user._id,
               category: fields.category[0].toLowerCase(),
               file: files.links[0].path
            }, function(err, report) {
               if (err) {
                  res.send('failure');
               } else {
                  console.log(report);
                  res.send('success');
               }
            });
         }
      });
   }
};
