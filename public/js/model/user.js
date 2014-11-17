'use strict';

var util = require('../util');
var state = {
   display: '',
   type: '',
   email: '',
   theme: 'light',
   suggestions: 'youtube'
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
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;

      var changed = {

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

   editUser: function(form, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/editUser',
         data: form.find(':input').serialize(),
         complete: function(data) {
            if (data.responseText === 'success') {
               cb(false, util.serialize(form));
            } else {
               cb({
                  msg: 'Unable to edit details.'
               });
            }
         }
      });
   }
};
