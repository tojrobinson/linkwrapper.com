'use strict';

var ElementManager = require('elman');
var em = new ElementManager();
var util = require('../util');
var dynamic = require('../views/dynamic');
var state = {
   activeList: {},
   minBar: false,
   sort: {
      sorted: false,
      descending: false,
      column: null
   },
   search: 'local'
};

module.exports = {
   init: function(views) {
      this.views = views;
      var active = $('#categories .selected');

      state.activeList = {
         type: 'category',
         name: active.find('.title-wrap').text(),
         id: active.find('.id').val()
      };

      this.loadList();
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;

      // notify views
      var changed = {
         minBar: function() {
            this.views.sideBar.render();
         },

         activeList: function() {
            this.loadList();
         },

         sort: function() {
            this.views.list.render();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   addLink: function(form, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/addLink',
         data: form.find(':input').serialize(),
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res.data);
               em.mutated();
            }
         }
      });
   },

   addToPlaylist: function(playlist, links, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/addToPlaylist',
         data: {id: playlist, links: links},
         complete: function(data) {

            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res);
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
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, util.serialize(form));

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
         url: '/a/deleteLinks',
         data: {linkIds: linkIds},
         complete: function(data) {
            if (data.responseText === 'success') {
               cb(null);
            } else {
               cb({
                  type: 'error',
                  msg: 'An error occurred during the removal of some links.'
               });
            }
         } 
      });
   },

   removeFromPlaylist: function(id, positions, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/removeFromPlaylist',
         data: { id: id, positions: positions },
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res);
            }
         }
      });
   },

   loadList: function(cb) {
      var views = this.views;
      state.sort = {
         sorted: false,
         descending: false,
         column: null
      };

      if (!state.activeList.id) {
         return false;
      }

      $.ajax({
         type: 'GET',
         url: '/a/' + state.activeList.type,
         data: {id: state.activeList.id},
         complete: function(data) {
            em.clear();

            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else if (res.type === 'success') {
               if (res.data) {
                  views.list.render(res.data);
               } else {
                  // TODO
                  // show add options
               }
            }

            em.sync({
               containerId: 'list-body',
               elementType: '.wrapped-link',
               cellType: '.item-content'
            });
         }
      });
   },

   deleteLists: function(type, ids, cb) {
      var toDelete = {
         type: type,
         ids: ids 
      };

      $.ajax({
         type: 'POST',
         url: '/a/deleteLists',
         data: toDelete,
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res);   
            }
         }
      });
   },

   editLists: function(type, lists, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/editLists',
         data: {
            type: type,
            lists: lists
         },
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res);
            }
         }
      });
   },

   addList: function(type, list, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/addList',
         data: {type: type, list: list},
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res.data.id);
            }
         }
      });
   },

   extract: function(form, cb) {
      var activeList = state.activeList;
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
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (activeList.type === 'category' && activeList.id === category) {
               that.loadList();
               em.mutated();
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res);
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
