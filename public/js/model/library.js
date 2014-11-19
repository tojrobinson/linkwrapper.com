'use strict';

var ElementManager = require('elman');
var em = new ElementManager();
var util = require('../util');
var state = {
   activeList: {},
   minBar: false,
   sort: {
      sorted: false,
      descending: false,
      column: null
   },
   search: 'local',
   editing: ''
};

module.exports = {
   init: function(views) {
      this.views = views;
      var active = $('#categories .selected');

      state.activeList = {
         type: 'category',
         name: active.text().toLowerCase()
      };
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
         },

         sort: function() {
            this.views.list.render();
         },

         editing: function() {
            this.views.sideBar[state.editing].render();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   addLink: function(form, cb) {
      var views = this.views;
      $.ajax({
         type: 'POST',
         url: '/a/addLink',
         data: form.find(':input').serialize(),
         complete: function(data) {
            if (!data || data.responseText === 'failure') {
               cb({
                  msg: 'Error adding link.'
               });
            } else {
               var model = JSON.parse(data.responseText);
               cb(false, model);
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
               cb(false, util.serialize(form));

               em.mutated({
                  threshold: 10
               });
            } else {
               cb({
                  msg: 'Unable to edit details.'
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
               cb({
                  msg: 'Error deleting links.'
               });
            }
         }
      });
   },

   loadList: function() {
      var views = this.views;
      state.sort = {
         sorted: false,
         descending: false,
         column: null
      };

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
      var views = this.views;
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

            if (data.responseText === 'success') {
               cb(false);
            } else {
               cb({
                  msg: 'Unable to extract links.'
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
