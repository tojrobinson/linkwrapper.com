'use strict';

var manager = require('./manager');
var user = require('./user');
var util = require('../util');
var sites = require('./sites');
var linkId = require('link-id');
var views = null;
var state = {
   shuffle: false,
   repeat: false,
   playing: {},
   height: 300,
   active: 'youtube',
   started: false,
   related: []
};

function play(link) {
   if (!link) {
      return;
   } else if (!link.obj) {
      link = util.buildLinkModel(link);
   }
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
      state.started = true;
      views.player.suggestions.render();
      addPlay(link.id);
      link.obj.find('.play-count').text(link.playCount + 1);
      link.obj.find('.play').addClass('playing');
      views.player.playing.render();
   } else {
      link.obj.addClass('link-error');
      return play(nextLink(link.obj));
   }
}

function nextLink(link) {
   link = link || state.playing.obj;
   var next = link.nextAll('.wrapped-link:visible')
                  .first();

   return (next.length) ? next : null;
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
            var links = $('.wrapped-link:visible');
            var index = Math.floor(Math.random() * links.length);
            var randomLink = $(links[index]);
            var search = 0;

            while (!randomLink && (++search < links.length)) {
               index = (index + search) % links.length;
               randomLink = $(links[index]);
            }

            play(randomLink);
         } else {
            play(nextLink());
         }
      });

      manager.on('error', function(e) {
         state.playing.obj.addClass('link-error');
         play(nextLink());
      });

      manager.on('playing', function(e) {
         if (state.started) {
            var details  = linkId(e.url);
            var source = user.get('suggestions');

            if (!source) {
               return;
            }

            var player = manager.getPlayer(source);

            if (source === details.type) {
               player.getRelated(details.id, function(related) {
                  if (related) {
                     state.related = related;
                     state.started = false;
                     views.player.suggestions.render();
                  }
               });
            } else {
               // fallback to search on player / source mimatch
               player.search(state.playing.artist || state.playing.title, function(related) {
                  state.related = related;
                  state.started = false;
                  views.player.suggestions.render();
               });
            }
         }
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

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   play: play,

   search: function(player, term, cb) {
      manager.getPlayer(player)
             .search(term, cb);
   }
};
