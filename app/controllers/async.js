'use strict';

var model = require('r/app/model');
var extractor = require('r/app/util/extractor');
var linkId = require('link-id');
var multiparty = require('multiparty');

module.exports = {
   playCount: function(req, res) {
      var linkId = req.body._id;

      model.linkDao.incrementCount(linkId, function(err) {
         if (err) {
            console.error(err);
            res.send('failure');
         } else {
            res.send('success');
         }
      });
   },

   renderCategory: function(req, res) {
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
            res.render('partials/listBody', {
               links: links
            });
         }
      });
   },

   renderPlaylist: function(req, res) {
      var playlists = req.user.lists.playlists,
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

   removeAllLinks: function(req, res) {
      var linkIds = req.body.linkIds;
      model.linkDao.removeAllLinks(linkIds, function(err) {
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

   removeList: function(req, res) {
      var name = req.query.name,
      removeFrom = req.query.removeFrom;

      if (removeFrom === 'playlists') {
         model.userDao.removePlaylise(req.user._id, name, function(err) {
            if (err) {
               res.send(err.message);
            } else {
               res.send('success');
            }
         });
      } else if (removeFrom === 'categories') {
         // TODO
         // remove links in categories only
         // grace period?
         model.userDao.removeCategory(req.user._id, name, function(err) {
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

   editLink: function(req, res) {
      var linkId = req.body.id;
      delete req.body.id;

      model.linkDao.updateLink(linkId, req.body, function(err) {
         if (err) {
            res.send(err.msg);
         } else {
            res.send('success');
         }
      });
   },

   updateSettings: function(req, res) {
      if (req || res) {}
   },

   extract: function(req, res) {
      var form = new multiparty.Form({encoding: 'utf8', maxFileSize: '5MB', maxFieldsSize: 50});

      form.parse(req, function(err, fields, files) {
         if (err) {
            res.send('failure');
         } else if (!files.links[0].originalFilename.trim()) {
            res.send('failure');
         } else {
            try {
               var file = files.links[0].path;
               extractor.extract(file, {userId: req.user._id, category: fields.category[0].toLowerCase()}, function(err, report) {
                  if (err) {
                     console.log(err);
                     res.send('failure');
                  } else {
                     req.report = report;
                     res.send('success');
                  }
               });
            } catch(e) {
               res.send('failure');
            }
         }
      });
   }
};
