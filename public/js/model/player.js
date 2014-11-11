'use strict';

var manager = require('./manager');
var sites = require('./sites');
var linkId = require('link-id');

manager.setContainer('player');
manager.use(new sites.YouTube('youtube'));

function play(link) {
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

      this.state.playing = link.title + ' - ' + link.artist;
      this.views.player.playing.render();
   }
};

module.exports = {
   play: play
};
