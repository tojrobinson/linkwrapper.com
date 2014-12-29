'use strict';

var validLink = require('r/app/model/link');
var db = require('r/app/util/db');
var parseLink = require('link-id');

var SUCCESS = 0;
var ERROR = 100;
var CATEGORY_MAX = 500;

module.exports = {
   addLink: function(link, cb) {
      link.category = db.mongoId(link.category);

      if (!validLink(link)) {
         return cb(null, {code: 112});
      }

      // assert no dead ref
      db.categories.findOne({
         _id: link.category,
         owner: link.owner
      }, {
         _id: 0,
         name: 1
      }, function(err, category) {
         if (err) {
            return cb(err, {code: 112});
         } else if (!category) {
            return cb(null, {code: 118});
         }

         db.links.count({
            category: link.category
         }, function(err, count) {
            if (err || typeof count !== 'number') {
               return cb(err, {code: 101});
            } else if (count >= CATEGORY_MAX) {
               return cb(null, {
                  code: 123,
                  data: {
                     name: category.name,
                     max: CATEGORY_MAX
                  }
               });
            }

            db.links.insert(link, function(err, result) {
               if (err) {
                  if (err.code === 11000) {
                     return cb(err, {
                        code: 111,
                        data: {
                           category: category.name
                        }
                     });
                  } else {
                     return cb(err, {code: 112});
                  }
               }
 
               var link = result[0];
               link.categoryName = category.name;
               cb(null, {
                  code: 13,
                  data: link
               });
            });
         });
      });
   },

   addManyLinks: function(insert, cb) {
      insert.category = db.mongoId(insert.category);
      insert.links = insert.links || [];

      if (!insert.category) {
         return cb(null, {code: 117});
      }

      // assert no dead ref
      db.categories.findOne({
         _id: insert.category,
         owner: insert.owner
      }, {
         _id: 0,
         name: 1
      }, function(err, category) {
         if (err) {
            return cb(err, {code: 116});
         } else if (!category) {
            return cb(null, {code: 118});
         }

         db.links.count({
            category: insert.category
         }, function(err, count) {
            if (err || typeof count !== 'number') {
               return cb(err, {code: 101});
            } else if (count >= CATEGORY_MAX) {
               return cb(null, {
                  code: 123,
                  data: {
                     name: category.name,
                     max: CATEGORY_MAX
                  }
               });
            }

            var links = [];
            var valid = 0;
            var inserted = 0;
            var frameSize = CATEGORY_MAX - count;

            insert.links.forEach(function(link) {
               link.other = '';
               link.owner = insert.owner;
               link.category = insert.category;
               link.playCount = 0;
               link.dateAdded = new Date();
               link.pending = true; // pseudo transaction

               if (validLink(link) && parseLink(link.url)) {
                  links.push(link);
                  valid++;
               }
            });

            (function insertLinks() {
               if (inserted >= frameSize || links.length < 1) {
                  var activated = 0;

                  // activate inserted frame
                  // trim overflow
                  db.links.find({
                     category: insert.category,
                     pending: true
                  }, {
                     snapshot: true,
                  }).limit(frameSize)
                    .toArray(function(err, links) {
                     links.forEach(function(link) {
                        delete link.pending;
                        db.links.save(link, function(err) {
                           if (++activated === frameSize) {
                              db.links.remove({
                                 category: insert.category,
                                 pending: {$exists: true}
                              }, function() {});
                           }
                        });
                     });
                  });
                  
                  if (inserted >= frameSize) {
                     return cb(null, {
                        code: 123,
                        data: {
                           name: category.name,
                           max: CATEGORY_MAX
                        }
                     });
                  }

                  return cb(null, {
                     code: 10,
                     data: {
                        valid: valid,
                        inserted: inserted
                     }
                  });
               }

               var bulk = db.links.initializeUnorderedBulkOp();
               var nextBatch = links.splice(0, CATEGORY_MAX);

               nextBatch.forEach(function(link) {
                  bulk.insert(link);
               });

               try {
                  bulk.execute(function(err, report) {
                     if (err) {
                        return cb(err, {code: 116});
                     }

                     inserted += report.nInserted;
                     return insertLinks();

                  });
               } catch (e) {
                  // nothing to insert for this batch
               }
            }());
         });
      });
   },

   // overload: Array of ids or query object
   deleteLinks: function(ids, cb) {
      var linkIds = ids.map(db.mongoId);
      db.links.remove({_id: {$in : linkIds}}, function(err) {
         if (err) {
            return cb(err, {code: ERROR});
         }

         cb(null, {code: SUCCESS});
      });
   },

   // overload: Array of ids or query object
   getLinks: function(query, cb) {
      if (query.constructor === Array) {
         var ids = query.map(db.mongoId);
         db.links.find({
            _id: {$in: ids}
         }, {
            dateAdded: 0,
            owner: 0
         }).toArray(cb);
      } else {
         if (!query.category || !query.owner) {
            // not using index
            console.error('Retrieved links without using index: ' + query);
         }

         if (query.category) {
            query.category = db.mongoId(query.category);
         }

         if (query.owner) {
            query.owner = db.mongoId(query.owner);
         }

         query.pending = {$exists: false};

         db.links.find(query, {
            dateAdded: 0,
            owner: 0
         }).toArray(function(err, links) {
            if (err) {
               return cb(err);
            }

            cb(null, links);
         });
      }
   },

   editLink: function(id, edit, cb) {
      edit = edit || {};
      id = db.mongoId(id);
      if (edit.category) {
         edit.category = db.mongoId(edit.category);
      }

      db.links.findOne({_id: id}, function(err, link) {
         if (err || !link) {
            return cb(err, {code: 113});
         }

         for (var field in edit) {
            link[field] = edit[field];
         }

         if (validLink(link)) {
            db.links.save(link, function(err) {
               if (err) {
                  if (err.code === 1100) {
                     cb(err, {code: 111});
                  } else {
                     cb(err, {code: 113});
                  }
               } else {
                  cb(null, {code: SUCCESS});
               }
            });
         } else {
            cb(null, {code: 114});
         }
      });
   },

   addPlay: function(linkId, cb) {
      db.links.update(
         {_id: db.mongoId(linkId)}, 
         {$inc: {playCount: 1}}, 
         {upsert: false, multi: false},
         cb
      );
   }
};
