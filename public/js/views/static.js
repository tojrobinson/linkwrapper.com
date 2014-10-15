'use strict';

var View = require('./view.js');
var dynamic = require('./dynamic.js');

var ToolsView = View.extend({
   el: '#player-tools',

   init: function() {
      this.addMenu = new AddMenuView;
   },

   events: {
      'click #add-button': 'renderAddMenu',
      'click #shuffle': 'toggleShuffle',
      'click #repeat': 'toggleRepeat'
   },

   renderAddMenu: function(e) {
      this.addMenu.render();
   },

   toggleShuffle: function() {
      var shuffle = $('#shuffle', this.el);
      if (shuffle.hasClass('active')) {
         shuffle.attr('src', '/img/shuffle.png')
                .removeClass('active');
      } else {
         shuffle.attr('src', '/img/shuffleActive.png')
                .addClass('active');
      }
   },

   toggleRepeat: function() {
      var repeat = $('#repeat', this.el);
      if (repeat.hasClass('active')) {
         repeat.attr('src', '/img/repeat.png')
               .removeClass('active');
      } else {
         repeat.attr('src', '/img/repeatActive.png')
               .addClass('active');
      }
   }
});

var AddMenuView = View.extend({
   el: '#add-menu',

   events: {
      'click .link': 'addLinkModal',
      'click .extract': 'extractModal'
   },

   render: function() {
      $(this.el).show();
   },

   addLinkModal: function() {
      var addLink = new dynamic.AddLinkModal;
   },

   extractModal: function() {
      var extract = new dynamic.ExtractModal;
   }
});

module.exports = {
   SideBarView: View.extend({
      init: function() {
         this.tools = new ToolsView;
      }
   }),
   PlayerView: View.extend({}),
   ListView: View.extend({})
};
