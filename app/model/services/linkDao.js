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
               cb({
                  msg: 'Unable to add link.',
                  obj: err
               });
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
            cb({
               type: 'error',
               msg: 'Unable to extract links.',
               obj: err
            });
         } else {
            var valid = 0;
            var bulk = db.links.initializeUnorderedBulkOp();

            results.links.forEach(function(link) {
               link.owner = opt.userId;
               link.category = opt.category;
               link.playCount = 0;
               link.dateAdded = new Date();

               if (validLink(link)) {
                  valid++;
                  bulk.insert(link);
               } else {
                  invalid.push(link);
               }
            });


            bulk.execute(function(err, report) {
               if (err) {
                  cb({
                     msg: 'There was an error during extraction.'
                  });
               } else {
                  cb(null, {
                     valid: valid,
                     inserted: report.nInserted
                  });
               }
            });
         }
      });
   },

   // overload Array of ids or query object
   deleteLinks: function(criteria, cb) {
      if (criteria.constructor === Array) {
         var linkIds = criteria.map(BSON.ObjectID);
         db.links.remove({_id: {$in : linkIds}}, cb);
      } else {
         db.links.remove(criteria, cb);
      }
   },

   // overload Array of ids or query object
   getLinks: function(criteria, cb) {
      if (criteria.constructor === Array) {
         var linkIds = criteria.map(BSON.OBjectID);
         db.links.find({_id: {$in: linkIds}}, cb);
      } else {
         db.links.find(criteria).toArray(cb);
      }
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
         cb
      );
   }
};
