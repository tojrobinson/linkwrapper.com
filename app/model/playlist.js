'use strict';

var checky = require('checky');
var t = require('./types');

var playlistSchema = checky({
   name: t.name,
   owner: t.ObjectID,
   isPublic: Boolean,
   links: Array,
   order: Number
});

module.exports = playlistSchema;
