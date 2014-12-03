'use strict';

var validLink = require('r/app/model/link');
var db = require('r/app/util/db');
var config = require('r/config/settings');
var d = require('r/app/views/dialogues');
var parseLink = require('link-id');

var SUCCESS = 0;
var ERROR = 100;

module.exports = {
   addLink: function(link, cb) {
      link.category = db.mongoID(link.category);

      if (!validLink(link, true)) {
         return cb(112);
      }

      // assert no dead ref
      db.categories.findOne({_id: link.category}, {_id: 1}, function(err, category) {
         if (err) {
            cb(112);
         } else if (!category) {
            cb(118);
         } else {
            db.links.insert(link, {safe: true}, function(err, result) {
               if (err) {
                  if (err.code === 11000) {
                     cb(111);
                  } else {
                     cb(112);
                  }
               } else {
                  cb(SUCCESS, result[0]);
               }
            });
         }
      });
   },

   addManyLinks: function(insert, cb) {
      insert.category = db.mongoID(insert.category);
      insert.links = insert.links || [];

      if (!insert.category) {
         return cb(117);
      }

      // assert no dead ref
      db.categories.findOne({
         _id: insert.category,
         owner: insert.owner
      }, {_id: 1}, function(err, category) {
         if (err) {
            return cb(116);
         } else if (!category) {
            return cb(118);
         }

         var valid = 0;
         var bulk = db.links.initializeUnorderedBulkOp();

         insert.links.forEach(function(link) {
            link.owner = insert.owner;
            link.category = insert.category;
            link.playCount = 0;
            link.dateAdded = new Date();

            if (validLink(link) && parseLink(link.url)) {
               valid++;
               bulk.insert(link);
            }
         });

         try {
            bulk.execute(function(err, report) {
               if (err) {
                  cb(116);
               } else {
                  cb(10, {
                     valid: valid,
                     inserted: report.nInserted
                  });
               }
            });
         } catch (e) {
            cb(10, {
               valid: 0,
               inserted: 0
            });
         }
      });
   },

   // overload Array of ids or query object
   deleteLinks: function(query, cb) {
      if (query.constructor === Array) {
         var linkIds = query.map(db.mongoID);
         db.links.remove({_id: {$in : linkIds}}, function(err) {
            (err) ? cb(ERROR) : cb(SUCCESS);
         });
      } else {
         db.links.remove(query, function(err) {
            (err) ? cb(ERROR) : cb(SUCCESS);
         });
      }
   },

   // overload Array of ids or query object
   getLinks: function(query, cb) {
      if (query.constructor === Array) {
         var ids = query.map(db.mongoID);
         db.links.find({_id: {$in: ids}}).toArray(cb);
      } else {
         if (query.category) {
            query.category = db.mongoID(query.category);
         }

         if (query.owner) {
            query.owner = db.mongoID(query.owner);
         }

         db.links.find(query).toArray(cb);
      }
   },

   editLink: function(id, edit, cb) {
      edit = edit || {};
      id = db.mongoID(id);
      if (edit.category) {
         edit.category = db.mongoID(edit.category);
      }

      db.links.findOne({_id: id}, function(err, link) {
         if (err || !link) {
            cb(113);
         } else {
            for (var field in edit) {
               link[field] = edit[field];
            }

            if (validLink(link, true)) {
               db.links.save(link, function(err) {
                  if (err) {
                     if (err.code === 1100) {
                        cb(111);
                     } else {
                        cb(113);
                     }
                  } else {
                     cb(SUCCESS);
                  }
               });
            } else {
               cb(114);
            }
         }
      });
   },

   addPlay: function(linkId, cb) {
      db.links.update(
         {_id: db.mongoID(linkId)}, 
         {$inc: {playCount: 1}}, 
         {upsert: false, multi: false},
         cb
      );
   }
};
