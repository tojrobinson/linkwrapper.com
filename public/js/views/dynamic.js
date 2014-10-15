'use strict';
var View = require('./view.js');

var Modal = View.extend({
   el: $('<form class="theme player-modal">'), // create el for dynamic view
   cover: $('<div class="view-cover">'),
   close: $('<div class="close-modal">'),
   submit: $('<input type="submit" class="form-button">'),
   unrender: function() {
      this.cover.remove();
      this.el.empty().remove();
   },
   events: {
      'click .close-modal': 'unrender'
   }
});

var ClickMenu = View.extend({
   el: $('<div class="add-menu click-menu">'),
   unrender: function() {
      this.el.empty().remove();
   }
});

module.exports = {

};
