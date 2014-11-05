'use strict';

var validLink = require('r/app/model/link');
var db = require('r/app/util/db');
var config = require('r/config/settings');
var extract = require('r/app/util/extractor');
var BSON = require('mongodb').BSONPure;

module.exports = {
   addLink: function(link, done) {
      if (!validLink(link, true)) {
         return done({msg: 'Invalid link.'});
      }

      db.links.insert(link, {safe: true}, function(err, result) {
         if (err) {
            console.error(err);
            done(err);
         } else {
            done(null, result[0]);
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
               saved: 0,
               failed: []
            };

            results.links.forEach(function(link) {
               link.owner = opt.userId;
               link.category = opt.category;
               link.playCount = 0;
               link.dateAdded = new Date();

               module.exports.addLink(link, function(err) {
                  if (err) {
                     console.log(err);
                     report.failed.push(link.url);
                  } else {
                     // TODO
                     // fix async data loss
                     report.saved++;
                  }
               });
            });

            cb(null, report);
         }
      });
   },

   removeAllLinks: function(linkIds, done) {
      linkIds = linkIds.map(BSON.ObjectID);
      db.links.remove({_id: {$in : linkIds}}, function(err) {
         if (err) {
            done(err);
         } else {
            done(null);
         }
      });
   },

   getLinks: function(criteria, done) {
      db.links.find(criteria).toArray(function(err, links) {
         if (err) {
            done(err);
         } else {
            done(null, links);
         }
      });
   },

   updateLink: function(linkId, update, done) {
      update = update || {};
      db.links.find({_id: BSON.ObjectID(linkId)}).toArray(function(err, link) {
         link = link && link[0];
         if (link) {
            Object.keys(update).forEach(function(key) {
               link[key] = update[key];
            });

            if (validLink(link)) {
               db.links.save(link, function(err) {
                  done(err);
               });
            } else {
               done({
                  msg: 'Invalid link.'
               });
            }
         } else {
            done({
               msg: 'Link not found.'
            });
         }
      });
   },

   incrementCount: function(linkId, done) {
      db.links.update(
         {_id: BSON.ObjectID(linkId)}, 
         {$inc: {playCount: 1}}, 
         {upsert: false, multi: false},
         function(err) {
            if (err) {
               done(err);
            } else {
               done(null);
            }
         }
      );
   }
};
