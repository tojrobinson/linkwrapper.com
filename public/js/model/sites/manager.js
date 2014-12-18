'use strict';

var emitter = new (require('events').EventEmitter);
var container = null;
var players = {};

function emit(type, data) {
   emitter.emit(type, data);
}

module.exports = {
   use: function(player) {
      player.init(container, emit);
      players[player.id] = player;
   },

   on: function(type, action) {
      emitter.on(type, action);
   },

   getPlayer: function(type) {
      return players[type];
   },

   setContainer: function(containerId) {
      container = document.getElementById(containerId);
      if (container === null) {
         throw new Error('[PlayerManager] Container ID does not exist: ' + containerId);
      }
   },

   clearContainer: function() {
      if (container && container.childNodes.length) {
         while (container.childNodes.length > 0) {
            container.removeChild(container.firstChild);
         }
      }
   }
};