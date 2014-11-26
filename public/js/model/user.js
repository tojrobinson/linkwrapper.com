'use strict';

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
      this.getUser(function(user) {
         if (user) {
            for (var item in user) {
               state[item] = user[item];
            }
         }
      });

      $('#categories .list-title').each(function(i) {
         var name = $(this).find('.title-wrap').text();
         var id = $(this).find('.id').val();

         state.categories.push({
            name: name,
            id: id,
            order: i
         });
      });

      $('#playlists .list-title').each(function(i) {
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
            if (data.responseText !== 'failure') {
               var user = JSON.parse(data.responseText);
               cb(user);
            } else {
               cb(null);
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
            if (data.responseText === 'success' && cb) {
               cb(false, edit);
            } else if (cb) {
               cb({
                  msg: 'Unable to edit details.'
               });
            }
         }
      });
   }
};
