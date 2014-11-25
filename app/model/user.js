'use strict';

var checky = require('checky');
var t = require('./types');

var userSchema = checky({
   display: t.display,
   email: t.email,
   password: String,
   type: String,
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

module.exports = userSchema;
