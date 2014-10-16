'use strict';

var player = require('./player');
var library = require('./library');

module.exports = {
   init: function(views) {
      this.views = views;
   },

   // library
   addLink: library.addLink,
   loadList: library.loadList
};
