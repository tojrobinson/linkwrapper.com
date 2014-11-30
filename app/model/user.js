'use strict';

var checky = require('checky');
var t = require('./types');

var userSchema = checky({
   display: t.display,
   email: t.email,
   password: String,
   type: String,
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

module.exports = userSchema;
