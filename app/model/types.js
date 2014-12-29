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
      max: 50
   },
   password: {
      type: String,
      max: 100
   },
   stringField: {
      type: String,
      max: 100
   },
   nonNegative: {
      type: Number,
      min: 0
   },
   email: {
      type: String,
      max: 50,
      pattern: /[^\s]+@[^\s]+\.[^\s]+/
   }
};
