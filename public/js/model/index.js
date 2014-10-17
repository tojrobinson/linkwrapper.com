'use strict';

var player = require('./player');
var library = require('./library');

module.exports = {
   init: function(views) {
      this.views = views;
   },

   state: {
      minBar: false
   },

   get: function(key) {
      return this.state[key];
   },

   set: function(key, val) {
      this.state[key] = val;

      /** notify view
      /*  -----------
      /*  minBar -> views.render
      **/
      if (key === 'minBar') {
         this.views.render();
      }
   },

   // library
   addLink: library.addLink,
   loadList: library.loadList
};
