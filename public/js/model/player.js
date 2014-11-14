'use strict';

var manager = require('./manager');
var util = require('../util');
var sites = require('./sites');
var linkId = require('link-id');
var views = null;
var state = {
   shuffle: false,
   repeat: false,
   playing: {},
   height: 300,
   active: 'youtube'
};

function play(link) {
   link = util.buildModel(link);
   var details = linkId(link.url);

   if (details) {
      if (state.active !== details.type) {
         var currPlayer = manager.getPlayer(state.active);

         if (currPlayer) {
            currPlayer.stop();
         }

         state.active = details.type;
         views.player.render();
      }

      manager.getPlayer(details.type)
             .play(details.id);

      state.playing = link;
      addPlay(link.id);
      link.obj.find('.play-count').text(link.playCount + 1);
      views.player.playing.render();
   } else {
      link.obj.css('background', '#F08D9E');
      return play(nextLink(link.obj));
   }
}

function nextLink(link) {
   link = link || state.playing.obj;
   return link.nextAll('.wrapped-link:visible')
              .first();
}

function addPlay(id) {
   $.ajax({
      type: 'POST',
      url: '/a/playcount',
      data: {_id: id}
   });
}

module.exports = {
   init: function(ui) {
      views = ui;
      manager.setContainer('player');
      manager.use(new sites.YouTube('youtube'));

      manager.on('ended', function(e) {
         if (state.repeat) {
            play(state.playing.obj);
         } else if (state.shuffle) {

         } else {
            play(nextLink());
         }
      });

      manager.on('error', function(e) {
         state.playing.obj.css('background', '#F08D9E');
         play(nextLink());
      });
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;
      var player = views.player;
      var list = views.list;

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

      changed[key].call(this);
   },

   play: play
};
