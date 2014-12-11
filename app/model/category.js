'use strict';

var checky = require('checky');
var t = require('./types');

var categorySchema = checky({
   name: t.name,
   owner: t.ObjectID,
   order: Number,
   _id: {
      type: t.ObjectID,
      optional: true
   }
});

module.exports = categorySchema;
