'use strict';

var checky = require('checky');
var t = require('./types');

var userSchema = checky({
   display: t.display,
   email: t.email,
   password: t.password,
   type: String,
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
   }
});

module.exports = userSchema;
