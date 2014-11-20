'use strict';

var db = require('r/app/util/db');
var config = require('r/config/settings');
var BSON = require('mongodb').BSONPure;

module.exports = {
   deleteLists: function(opt, cb) {
      var criteria = {};
      criteria.owner = BSON.ObjectID(opt.owner);

      if (opt.type === 'category') {
         criteria.category = {$in : opt.lists};
         db.links.remove(criteria, cb);
      } else if (opt.type === 'playlist') {
         criteria.name = {$in : opt.lists};
         db.playlists.remove(criteria, cb);
      }
   }
};
