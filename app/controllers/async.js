'use strict';

var models = require('r/app/models');
var linkId = require('link-id');

exports.playCount = function(req, res) {
   var linkId = req.body._id;

   models.linkDao.incrementCount(linkId, function(err) {
      if (err) {
         console.error(err);
         res.send('failure');
      } else {
         res.send('success');
      }
   });
}

exports.renderCategory = function(req, res) {
   var category = req.query.name,
       userId = req.user._id;

   if (!category) {
      return res.render('notifications/loadError', {message: 'invalid cateogry'});
   }

   models.linkDao.getLinks({
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
}

exports.renderPlaylist = function(req, res) {
   var playlists = req.user.lists.playlists,
       playlistName = req.query.name,
       linkIds = null;

   for (var i = 0; i < playlists.length; ++i) {
      if (playlists[i].name === playlistName) {
         linkIds = playlists[i].links;
      }
   }

   if (linkIds && linkIds.length) {
      models.linkDao.getLinks({
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
}

exports.addLink = function(req, res) {
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

      models.linkDao.addLink(link, function(err, result) {
         if (err) {
            res.send('failure');
         } else {
            res.json(link);
         }
      });
   } else {
      // invalid link
   }
}

exports.removeAllLinks = function(req, res) {
   var linkIds = req.body.linkIds;
   models.linkDao.removeAllLinks(linkIds, function(err) {
      if (err) {
         console.log(err);
         res.send('failure');
      } else {
         res.send('success');
      }
   });
}

exports.createList = function(req, res) {
   var name = req.query.name,
       addTo = req.query.addTo;

   if (addTo === 'playlists') {
      models.userDao.addPlaylist(req.user._id, name, function(err) {
         if (err) {
            res.send(err.message);
         } else {
            res.send('success');
         }
      });
   } else if (addTo === 'categories') {
      models.userDao.addCategory(req.user._id, name, function(err) {
         if (err) {
            res.send(err.message);
         } else {
            res.send('success');
         }
      });
   } else {
      res.send('failure');
   }
}

exports.removeList = function(req, res) {
   var name = req.query.name,
       removeFrom = req.query.removeFrom;

   if (removeFrom === 'playlists') {
      models.userDao.removePlaylise(req.user._id, name, function(err) {
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
      models.userDao.removeCategory(req.user._id, name, function(err) {
         if (err) {
            res.send(err.message);
         } else {
            res.send('success');
         }
      });
   } else {
      res.send('failure');
   }
}

exports.editLink = function(req, res) {
   var linkId = req.body.id;
   delete req.body.id;

   models.linkDao.updateLink(linkId, req.body, function(err) {
      if (err) {
         res.send(err.msg);
      } else {
         res.send('success');
      }
   });
}

exports.updateSettings = function(req, res) {
   if (req || res) {}
}

exports.extract = function(req, res) {
   var multiparty = require('multiparty'),
       form = new multiparty.Form({encoding: 'utf8', maxFileSize: '5MB', maxFieldsSize: 50}),
       extractor = require('r/app/utils').extractor;

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
