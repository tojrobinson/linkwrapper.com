'use strict';

var manager = require('./manager');
var util = require('../util');
var sites = require('./sites');
var linkId = require('link-id');
var state = {
   shuffle: false,
   repeat: false,
   playing: {},
   height: 300,
   active: 'youtube'
};

module.exports = {
   init: function(views) {
      var play = this.play;
      this.views = views;
      manager.setContainer('player');
      manager.use(new sites.YouTube('youtube'));

      manager.on('ended', function(e) {
         if (state.repeat) {
            play(state.playing);
         } else if (state.shuffle) {
            alert('shuffle');
         } else {
            var link = state.playing.obj;
            var next = util.buildModel(link.next(':visible'));
            if (next) {
               play(next);
            }
         }
      });
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;
      var player = this.views.player;
      var list = this.views.list;

      // notify views
      var changed = {
         height: function() {
            player.render();
            list.render();
         },

         playing: function() {
            player.playing.render();
         },

         active: function() {
            player.render();
         }
      };

      viewMap[key].call(this);
   },

   play: function (link) {
      var details = linkId(link.url);

      if (details) {
         if (state.active !== details.type) {
            var currPlayer = manager.getPlayer(state.active);

            if (currPlayer) {
               currPlayer.stop();
            }

            state.active = details.type;
            this.views.player.render();
         }

         manager.getPlayer(details.type)
                .play(details.id);

         state.playing = link;
         this.views.player.playing.render();
      }
   }
};
