'use strict';

var ElementManager = require('elman');
var em = new ElementManager;

module.exports = {
   addLink: function(link, cb) {
      $.ajax({
         type: 'POST',
         url: '/async/addLink',
         data: link,
         complete: function(data) {
            if (!data || data.responseText === 'failure') {
               cb(false);
            } else {
               cb(data.responseText);
               em.mutated();
            }
         }
      });
   },

   loadList: function(list) {
      var views = this.views;

      $.ajax({
         type: 'GET',
         url: '/async/renderCategory',
         data: {name: list},
         complete: function(data) {
            if (!data || data.responseText === 'failure') {
               // TODO
               // notify error view
            } else {
               em.clear();
               views.list.render(data.responseText);
               em.sync({
                  containerId: 'list-body',
                  elementType: '.wrapped-link',
                  cellType: '.item-content'
               });
            }
         }
      });
   }
};
