'use strict';

var checky = require('checky');
var t = require('./types');

var linkSchema = checky({
   url: t.url,
   title: t.stringField,
   artist: t.stringField,
   other: t.stringField,
   category: t.ObjectID,
   owner: t.ObjectID,
   playCount: {
      type: Number,
      min: 0
   },
   dateAdded: Date,
   _id: {
      type: t.ObjectID,
      optional: true
   },
});

module.exports = linkSchema;
