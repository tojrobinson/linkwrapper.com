'use strict';

var validLink = require('r/app/model/link');
var db = require('r/app/util/db');
var config = require('r/config/settings');
var extract = require('r/app/util/extractor');
var BSON = require('mongodb').BSONPure;

module.exports = {
   addLink: function(link, cb) {
      if (!validLink(link, true)) {
         return cb({msg: 'Invalid link.'});
      }

      db.links.insert(link, {safe: true}, function(err, result) {
         if (err) {
            if (err.code === 11000) {
               cb({msg: 'Link already exists.'});
            } else {
               cb(err);
            }
         } else {
            cb(null, result[0]);
         }
      });
   },

   extractLinks: function(opt, cb) {
      extract(opt.file, {
         sites: config.mediaSites
      }, function(err, results) {
         if (err) {
            cb(err);
         } else {
            var report = {
               found: results.found,
               filtered: results.filtered,
               failed: []
            };

            results.links.forEach(function(link) {
               link.owner = opt.userId;
               link.category = opt.category;
               link.playCount = 0;
               link.dateAdded = new Date();

               module.exports.addLink(link, function(err) {
                  if (err) {
                     // TODO
                     // fix async data loss
                     report.failed.push(link.url);
                  }
               });
            });

            cb(null, report);
         }
      });
   },

   removeAllLinks: function(linkIds, cb) {
      linkIds = linkIds.map(BSON.ObjectID);
      db.links.remove({_id: {$in : linkIds}}, function(err) {
         if (err) {
            cb(err);
         } else {
            cb(null);
         }
      });
   },

   getLinks: function(criteria, cb) {
      db.links.find(criteria).toArray(function(err, links) {
         if (err) {
            cb(err);
         } else {
            cb(null, links);
         }
      });
   },

   editLink: function(linkId, edit, cb) {
      edit = edit || {};
      db.links.find({_id: BSON.ObjectID(linkId)}).toArray(function(err, link) {
         link = link && link[0];
         if (err || !link) {
            cb({
               msg: 'Unable to edit link.'
            });
         } else {
            for (var field in edit) {
               link[field] = edit[field];
            }

            if (validLink(link)) {
               db.links.save(link, function(err) {
                  cb(err);
               });
            } else {
               cb({
                  msg: 'Invalid link.'
               });
            }
         }
      });
   },

   incrementCount: function(linkId, cb) {
      db.links.update(
         {_id: BSON.ObjectID(linkId)}, 
         {$inc: {playCount: 1}}, 
         {upsert: false, multi: false},
         function(err) {
            if (err) {
               cb(err);
            } else {
               cb(null);
            }
         }
      );
   }
};
