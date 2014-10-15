'use strict';

var View = require('./view.js');
var dynamic = require('./dynamic.js');

var ToolsView = View.extend({
   el: '#player-tools',

   events: {
      'click #add-button': 'showAddMenu'
   },

   showAddMenu: function(e) {
      $('#add-menu', this.el).show();
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
