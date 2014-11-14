'use strict';

var ElementManager = require('elman');
var em = new ElementManager();
var state = {
   categories: {},
   playlists: {},
   activeList: {},
   minBar: false
};

module.exports = {
   init: function(views) {
      this.views = views;
      var active = $('#categories .selected');

      state.activeList = {
         type: 'category',
         name: active.text().toLowerCase()
      };

      $('.category-title').each(function(i) {
         state.categories[$(this).text().toLowerCase()] = i;
      });

      $('.playlist-title').each(function(i) {
         state.playlists[$(this).text().toLowerCase()] = i;
      });
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;

      // notify views
      var changed = {
         minBar: function() {
            this.views.render();
         },

         activeList: function() {
            this.loadList();
         }
      };

      changed[key].call(this);
   },

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
               cb(data);
               var newLink = JSON.parse(data.responseText);
               views.list.addLink(newLink);
               em.mutated();
            }
         }
      });
   },

   editLink: function(form, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/editlink',
         data: form.find(':input').serialize(),
         complete: function(data) {
            if (data.responseText === 'success') {
               cb(false);
            } else {
               cb(true);
               em.mutated({
                  threshold: 10
               });
            }
         }
      });
   },

   deleteLinks: function(linkIds, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/removeAllLinks',
         data: {linkIds: linkIds},
         complete: function(data) {
            if (data.responseText === 'success') {
               cb(false);
            } else {
               cb(true);
            }
         }
      });
   },

   loadList: function() {
      var views = this.views;

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

   extract: function(form, cb) {
      var activeList = state.activeList;
      var sideBar = this.views.sideBar;
      var that = this;
      var category = form.find(':selected').val();

      $.ajax({
         type: 'POST',
         url: '/a/extract',
         data: new FormData(form[0]),
         cache: false,
         contentType: false,
         processData: false,
         complete: function(data) {
            if (activeList.type === 'category' && activeList.name === category) {
               that.loadList();
               em.mutated();
            }

            if (data.responseText !== 'failure') {
               cb(data);
            } else {
               cb(false);
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
