'use strict';

var manager = require('./sites/manager');
var user = require('./user');
var util = require('../util');
var sites = require('./sites');
var linkId = require('link-id');
var views = null;
var cache = require('./dbCache');
var state = {
   shuffle: false,
   repeat: false,
   playing: {},
   height: 300,
   active: 'youtube',
   related: {}
};

function play(link) {
   if (!link) {
      return false;
   } else if (link instanceof jQuery) {
      link = util.buildLink(link);
   }

   var details = linkId(link.url);

   if (details) {
      if (state.active !== details.type) {
         manager.action({
            type: 'stop',
            player: state.active
         });

         state.active = details.type;

         if (!manager.getPlayer(details.type)) {
            state.active = null;
         }

         views.player.render();
      }

      var playSuccess = manager.action({
         type: 'load',
         player: details.type,
         args: [details.id]
      });

      if (playSuccess) {
         state.playing = link;
         views.player.playing.render();

         if (link.type === 'main') {
            addPlay(link._id);
         }
      }
   } else if (link.type === 'main') {
      link.obj.addClass('link-error');
      return play(nextLink(link.obj));
   }
}

function nextLink(link) {
   link = link || state.playing.obj;

   if (!link) {
      return null;
   }

   var next = link.nextAll('.wrapped-link:visible')
                  .first();

   return (next.length) ? next : null;
}

function addPlay(id) {
   $.ajax({
      type: 'POST',
      url: '/a/addPlay',
      data: {_id: id},
      complete: function() {
         cache.getItem('link', id).playCount++;
      }
   });
}

module.exports = {
   init: function(ui) {
      views = ui;
      manager.setContainer('player');
      manager.addPlayer(new sites.YouTube('youtube'));
      manager.addPlayer(new sites.Vimeo('vimeo'));

      manager.on('ended', function(e) {
         if (state.repeat) {
            play(state.playing);
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
         if (state.playing.obj) {
            state.playing.obj.addClass('link-error');
            play(nextLink());
         }
      });

      manager.on('playing', function(e) {
         var details = linkId(e.url);
         var settings = user.get('settings');
         var opt = {};

         if (details && settings.suggestions === details.type) {
            opt = {
               id: details.id,
               type: 'related'
            };
         } else {
            // fallback to default search on player / source mimatch
            opt = {
               term: state.playing.artist || state.playing.title,
               type: 'default'
            };
         }

         var cb = function(results) {
            if (results) {
               state.related = results;
               views.player.suggestions.render();
            }
         }

         manager.action({
            type: 'search',
            player: settings.suggestions,
            args: [opt, cb]
         });
      });
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;
      var player = views.player;

      // notify views
      var changed = {
         height: function() {
            player.render();
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

   play: play
};
