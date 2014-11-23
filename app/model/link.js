'use strict';

var checky = require('checky');
var types = require('./types');

var linkSchema = checky({
   url: types.url,
   title: types.stringField,
   artist: types.stringField,
   other: types.stringField,
//   category: types.stringField, ref to category
   mediaType: String,
   playCount: {
      type: Number,
      min: 0
   },
   //owner: , TODO
   dateAdded: Date
});

module.exports = linkSchema;
