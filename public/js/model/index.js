'use strict';

var player = require('./player');
var user = require('./user');
var list = require('./list');
var ui = require('./ui');

module.exports = {
   init: function(views) {
      // inject views
      player.init(views);
      user.init(views);
      list.init(views);
      ui.init(views);
   }
};
