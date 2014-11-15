'use strict';

var checky = require('checky');
var types = require('./types');

var remoteUserSchema = checky({
   first: types.name,
   last: types.name,
   display: types.name,
   email: {
      type: types.email,
      optional: true
   },
   type: String,
   remote_id: String,
   joined: Date,
   active: types.bool,
   settings: {
      type: Object,
      fields: {
         theme: String
      }
   },
   categories: Array,
   playlists: Array
});

module.exports = remoteUserSchema;
