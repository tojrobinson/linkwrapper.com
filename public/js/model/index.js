'use strict';

var player = require('./player');
var library = require('./library');

module.exports = {
   init: function(views) {
      this.views = views;
   },

   state: {
      minBar: false,
      playerHeight: 300,
      cooldown: false
   },

   get: function(key) {
      return this.state[key];
   },

   set: function(key, val) {
      this.state[key] = val;

      /** notify view
      /*  -----------
      /*  minBar       -> views.render
      /*  playerHeight -> views.player.render
      **/
      if (key === 'minBar') {
         this.views.render();
      } else if (key === 'playerHeight') {
         console.log('RENDER player m8');
         this.views.player.render();
      } else if (key === 'cooldown') {
         var state = this.state;
         setTimeout(function() {
            state.cooldown = false;
         }, 1000);
      }
   },

   // library
   addLink: library.addLink,
   loadList: library.loadList,
   sort: library.sort,
   search: library.search
};
