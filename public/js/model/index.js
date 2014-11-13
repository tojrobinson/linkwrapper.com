'use strict';

var player = require('./player');
var library = require('./library');

module.exports = {
   init: function(views) {
      this.views = views;

      var state = this.state;
      var active = $('#side-bar .selected');
      var type = (active.attr('class').match(/category/)) ? 'category' : 'playlist';

      $('.category-title').each(function(i) {
         state.categories[$(this).text().toLowerCase()] = i;
      });

      $('.playlist-title').each(function(i) {
         state.playlists[$(this).text().toLowerCase()] = i;
      });

      this.state.activeList = {
         type: type,
         name: active.text().toLowerCase()
      };
   },

   state: {
      minBar: false,
      playerHeight: 300,
      categories: {},
      playlists: {},
      activeList: {type: 'category', name: ''},
      activePlayer: 'youtube',
      shuffle: false,
      repeat: false
   },

   get: function(key) {
      return this.state[key];
   },

   set: function(key, val) {
      this.state[key] = val;

      /** notify view on model update
      /*  ---------------------------
      /*  minBar       -> views.render
      /*  playerHeight -> views.player.render && view.list.render
      /*  activeList   -> views.list.render
      /*  playing      -> views.player.playing.render
      /*  activePlayer -> views.player.render
      **/
      if (key === 'minBar') {
         this.views.render();
      } else if (key === 'playerHeight') {
         this.views.player.render();
         this.views.list.render();
      } else if (key === 'activeList') {
         this.loadList();
      } else if (key === 'playing') {
         this.views.player.playing.render();
      } else if (key === 'activePlayer') {
         this.views.player.render();
      }
   },

   // library
   addLink: library.addLink,
   loadList: library.loadList,
   sort: library.sort,
   search: library.search,
   extract: library.extract,

   // player
   play: player.play
};
