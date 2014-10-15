'use strict';

var db = require('r/app/utils/dbConnect');
var BSON = require('mongodb').BSONPure;
var validLink = require('r/app/models/link');

exports.addLink = function(link, done) {
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
}

exports.removeAllLinks = function(linkIds, done) {
   linkIds = linkIds.map(BSON.ObjectID);
   db.links.remove({_id: {$in : linkIds}}, function(err) {
      if (err) {
         done(err);
      } else {
         done(null);
      }
   });
}

exports.getLinks = function(criteria, done) {
   db.links.find(criteria).toArray(function(err, links) {
      if (err) {
         done(err);
      } else {
         done(null, links);
      }
   });
}

exports.updateLink = function(linkId, update, done) {
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
}

exports.incrementCount = function(linkId, done) {
   db.links.update(
   {_id: BSON.ObjectID(linkId)}, 
   {$inc: {playCount: 1}}, 
   {upsert: false, multi: false}, function(err) {
      if (err) {
         done(err);
      } else {
         done(null);
      }
   });
}
