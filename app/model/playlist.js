'use strict';

var checky = require('checky');
var types = require('./types');

var playlistSchema = checky({
   name: String,
   //owner: ObjectID,
   isPublic: types.bool,
   links: Array,
   order: Number
});

module.exports = playlistSchema;
