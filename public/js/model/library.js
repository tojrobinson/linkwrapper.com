'use strict';

var ElementManager = require('elman');
var em = new ElementManager;

module.exports = {
   addLink: function(form, cb) {
      var views = this.views;
      $.ajax({
         type: 'POST',
         url: '/a/addLink',
         data: form.find(':input').serialize(),
         complete: function(data) {
            if (!data || data.responseText === 'failure') {
               cb(false);
            } else {
               // if same category
               cb(data);
               var newLink = JSON.parse(data.responseText);
               views.list.addLink(newLink);
               em.mutated();
            }
         }
      });
   },

   loadList: function() {
      var views = this.views;
      var state = this.state;

      $.ajax({
         type: 'GET',
         url: '/a/' + state.activeList.type,
         data: {name: state.activeList.name},
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
   },

   sort: function(opt) {
      em.sort(opt);
   },

   search: function(opt) {
      em.search(opt);
   }
};
