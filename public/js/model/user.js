'use strict';

var util = require('../util');
var views = null;
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
   init: function(ui) {
      views = ui;
      this.getUser(function(err, user) {
         if (user) {
            for (var item in user) {
               state[item] = user[item];
            }
         }
      });

      this.getUserLists(function(err, lists) {
         if (lists) {
            state.categories = lists.categories;
            state.playlists = lists.playlists;
         } else { // fallback update model manually
            $('.list-title', '#category-titles').each(function(i) {
               var name = $(this).find('.title-wrap').text();
               var id = $(this).find('.id').val();

               state.categories.push({
                  name: name,
                  id: id,
                  order: i
               });
            });

            $('.list-title', '#playlist-titles').each(function(i) {
               var name = $(this).find('.title-wrap').text();
               var id = $(this).find('.id').val();
               state.playlists.push({
                  name: name,
                  id: id,
                  order: i
               });
            });
         }

         if (state.categories.length > 8) {
            views.sideBar.categories.render();
         }
      });


   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      var sideBar = views.sideBar;

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

   getUserLists: function(cb) {
      $.ajax({
         type: 'GET',
         url: '/a/getUserLists',
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               var lists = res.data;

               lists.categories.forEach(function(list) {
                  list.id = list._id;
               });

               lists.playlists.forEach(function(list) {
                  list.id = list._id;
               });

               cb(null, lists);
            }
         }
      });
   },

   editUser: function(edit, cb) {
      if (edit.display.length > 14) {
         new views.Notification({
            type: 'error',
            msg: 'Display must be less than 15 characters.'
         });
      } else {
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
                  cb(res);
               } else {
                  cb(null)
               }
            }
         });
      }
   }
};
