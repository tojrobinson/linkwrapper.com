'use strict';

var manager = require('./manager');
var sites = require('./sites');
var util = require('../util');
var linkId = require('link-id');

manager.setContainer('player');
manager.use(new sites.YouTube('youtube'));

function play(link) {
   link = util.buildModel(link);
   var details = linkId(link.url);

   if (details) {
      if (this.state.activePlayer !== details.type) {
         var currPlayer = manager.getPlayer(this.state.activePlayer);

         if (currPlayer) {
            currPlayer.stop();
         }

         this.state.activePlayer = details.type;
         this.views.player.render();
      }

      manager.getPlayer(details.type)
             .play(details.id);

      this.state.playing = link;
      this.views.player.playing.render();
   }
};

module.exports = {
   play: play
};
