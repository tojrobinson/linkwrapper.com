'use strict';

var checky = require('checky');
var types = require('./types');

var userSchema = checky({
   display: types.display,
   email: types.email,
   password: String,
   type: String,
   joined: Date,
   active: types.bool,
   settings: {
      type: Object,
      fields: {
         theme: String,
         suggestions: String
      }
   },
   categories: Array,
   playlists: Array
});

module.exports = userSchema;
