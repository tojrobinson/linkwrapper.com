'use strict';

var View = require('./view.js');
var dynamic = require('./dynamic.js');

var ToolsView = View.extend({
   el: '#player-tools',

   init: function() {
      this.addMenu = new AddMenuView;
   },

   events: {
      'click #add-button': 'renderAddMenu'
   },

   renderAddMenu: function(e) {
      this.addMenu.render();
   }
});

var AddMenuView = View.extend({
   el: '#add-menu',

   events: {
      'click .extract': 'extractModal'
   },

   render: function() {
      $(this.el).show();
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
