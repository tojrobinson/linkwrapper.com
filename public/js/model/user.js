'use strict';

var util = require('../util');
var state = {
   display: '',
   type: '',
   email: '',
   theme: 'light',
   settings: {
      suggestions: 'youtube',
      theme: 'light',
      sideBar: 'default'
   },
   categories: [],
   playlists: []
};

module.exports = {
   init: function(views) {
      this.views = views;
      this.getUser(function(err, user) {
         if (user) {
            for (var item in user) {
               state[item] = user[item];
            }
         }
      });

      $('.list-title', '#category-manager').each(function(i) {
         var name = $(this).find('.title-wrap').text();
         var id = $(this).find('.id').val();

         state.categories.push({
            name: name,
            id: id,
            order: i
         });
      });

      $('.list-title', '#playlist-manager').each(function(i) {
         var name = $(this).find('.title-wrap').text();
         var id = $(this).find('.id').val();
         state.playlists.push({
            name: name,
            id: id,
            order: i
         });
      });
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      var sideBar = this.views.sideBar;

      if (key === 'settings') {
         for (var field in val) {
            state.settings[field] = val[field];
         }
      } else {
         state[key] = val;
      }

      var changed = {
         playlists: function() {
            sideBar.playlists.render();
         },

         categories: function() {
            sideBar.categories.render();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   getUser: function(cb) {
      $.ajax({
         type: 'GET',
         url: '/a/getUser',
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res.data);
            }
         }
      });
   },

   editUser: function(edit, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/editUser',
         data: {json: JSON.stringify(edit)},
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error' && cb) {
               cb(edit);
            } else {
               cb(null)
            }
         }
      });
   }
};
