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
      optional: true
   },
   type: String,
   remoteId: String,
   joined: Date,
   active: Boolean,
   settings: {
      type: Object,
      fields: {
         theme: String,
         suggestions: String
      }
   },
   token: {
      type: String,
      optional: true
   },
   newEmail: {
      type: String,
      optional: true
   }
});

module.exports = remoteUserSchema;
