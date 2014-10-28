'use strict';

var container = null;
var players = {};
var emitter = new (require('events').EventEmitter)()

function emit(type, data) {
   emitter.emit(type, data);
}

module.exports = {
   on: function(type, action) {
      emitter.on(type, action);
   },

   addPlayer: function(name, player) {
      if (!name || !player || (player.constructor !== Object)) {
         throw new Error('[PlayerManager New player must have a name and interface implementation.'); 
      }

      player.init(container, emit);
      players[name] = player;
   },

   getPlayer: function(type) {
      if (!players[type]) {
         throw new Error('[PlayerManager] Player does not exist: ' + type); 
      }

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
