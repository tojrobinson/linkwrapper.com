'use strict';

var checky = require('checky');
var types = require('./types');

var categorySchema = checky({
   name: String,
   //owner: ObjectID
   order: Number
});

module.exports = categorySchema;
