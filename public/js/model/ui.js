'use strict';

var state = {
   minBar: false,
   forceMinBar: false,
   menuProtect: false,
   cooling: false
};

module.exports = {
   init: function(views) {
      this.views = views;
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;

      var changed = {
         forceMinBar: function() {
            state.minBar = state.forceMinBar;
            this.views.sideBar.render();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   cooldown: function() {
      if (state.cooling) {
         return true;
      }

      state.cooling = true;
      setTimeout(function() {
         state.cooling = false;
      }, 500);

      return false;
   }
};
