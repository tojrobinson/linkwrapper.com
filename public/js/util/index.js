'use strict';

var cooling = false;
var Notification = null;
var preload = require('./preload');

module.exports = {
   UNAUTHORIZED: 401,
   SUCCESS: 0,
   ERROR: 100,

   init: function(notify) {
      // wtf fb
      if (window.location.hash.match(/#.*/)) {
         window.location.hash = '';
         history.pushState('', document.title, window.location.pathname);
      }

      preload.all();
      Notification = notify;
   },

   serialize: function(obj) {
      var o = {};
      var a = obj.serializeArray();
      $.each(a, function() {
         o[this.name] = this.value || '';
      });
      return o;
   },

   cooldown: function() {
      if (cooling) {
         return true;
      }

      cooling = true;
      setTimeout(function() {
         cooling = false;
      }, 500);

      return false;
   },

   uniqueNames: function(items, key) {
      var set = {};

      for (var i = 0; i < items.length; ++i) {
         var val = (key !== undefined) ? items[i][key] : items[i];
         val = val.toLowerCase();

         if (set.hasOwnProperty(val)) {
            return false;
         } else {
            set[val] = true;
         }
      }

      return true;
   },

   parseResponse: function(data) {
      if (!data || !data.responseText) {
         return null;
      }

      if (data.status === 401) {
         new Notification({
            type: 'error',
            msg: 'Your session has expired. Please <a href="/">' +
                 '<strong class="notification-link">login</strong>' +
                 '</a> to use this feature.'
         });

         return null;
      }

      try {
         var res = $.parseJSON(data.responseText);

         if (res.msg) {
            res.msg = Mustache.render(res.msg, res.data);
         }

         return res;
      } catch (e) {
         return null;
      }
   },

   mongoId: function(id) {
      return typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);
   },

   buildLink: function(link) {
      link = link.closest('.wrapped-link');
      return {
         type: 'main',
         title: link.find('.title').text(),
         artist: link.find('.artist').text(),
         other: link.find('.other').text(),
         url: link.find('.url').text(),
         id: link.find('._id').text(),
         category: link.find('.category').text(),
         playCount: parseInt(link.find('.play-count').text()),
         obj: link
      };
   }
};
