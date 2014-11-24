'use strict';

var checky = require('checky');
var types = require('./types');

var remoteUserSchema = checky({
   first: types.name,
   last: types.name,
   display: types.display,
   email: {
      type: String,
      pattern: /.*@.*\..*/,
      optional: true
   },
   type: String,
   remoteId: String,
   joined: Date,
   active: types.bool,
   settings: {
      type: Object,
      fields: {
         theme: String,
         suggestions: String
      }
   }
});

module.exports = remoteUserSchema;
