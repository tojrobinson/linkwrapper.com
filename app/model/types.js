'use strict';

var BSON = require('mongodb').BSONPure;

module.exports = {
   ObjectID: BSON.ObjectID,
   url: {
      type: String,
      max: 250
   },
   display: {
      type: String,
      max: 14,
      optional: true
   },
   name: {
      type: String,
      max: 100
   },
   stringField: {
      type: String,
      max: 100
   },
   email: {
      type: String,
      max: 100,
      pattern: /.*@.*\..*/
   }
};
