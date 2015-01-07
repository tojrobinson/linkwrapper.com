'use strict';

var checky = require('checky');
var t = require('./types');

var remoteUserSchema = checky({
   first: t.name,
   last: t.name,
   display: t.display,
   email: {
      type: String,
      pattern: /[^\s]+@[^\s]+\.[^\s]+/,
      max: 50,
      optional: true
   },
   type: String,
   remoteId: String,
   joined: Date,
   settings: {
      type: Object,
      fields: {
         theme: String,
         suggestions: String
      }
   },
   _id: {
      type: t.ObjectID,
      optional: true
   },
});

module.exports = remoteUserSchema;
