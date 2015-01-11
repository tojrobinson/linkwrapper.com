'use strict';

var db = require('r/app/util/db');

module.exports = {
   get: function(id, cb) {
      db.transactions.findOne({
         _id: db.mongoId(id)
      }, cb);
   },

   set: function(doc, cb) {
      db.transactions.insert(doc, cb);
   }
};
