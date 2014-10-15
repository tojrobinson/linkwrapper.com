'use strict';

var checky = require('checky');
var types = require('./types');

var userSchema = checky({
   first: types.name,
   last: types.name,
   email: types.email,
   type: String,
   remote_id: String,
   password: types.password,
   joined: Date,
   active: types.bool,
   settings: {
      type: Object,
      fields: {
         theme: String
      }
   },
   // TODO
   // collections: Object, simplify to this
   // playlists: Object 
   lists: {
      type: Object,
      fields: {
         categories: Array,
         playlists: Array
      }
   }
});

module.exports = userSchema;
