'use strict';

var checky = require('checky');
var t = require('./types');

var remoteUserSchema = checky({
   first: t.name,
   last: t.name,
   display: t.display,
   email: {
      type: String,
      pattern: /.*@.*\..*/,
      optional: true
   },
   type: String,
   remoteId: String,
   joined: Date,
   active: t.bool,
   settings: {
      type: Object,
      fields: {
         theme: String,
         suggestions: String
      }
   }
});

module.exports = remoteUserSchema;
