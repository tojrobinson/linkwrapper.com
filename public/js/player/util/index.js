'use strict';

var Notification = null;
var preload = require('./preload');
var extract = require('./extractor');

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

      // get bar width
      var box = $( '<div><div></div></div>' )
          .css({
              position: 'absolute',
              left: -1000,
              width: 300,
              overflow: 'scroll'
          })
          .appendTo( 'body' );
      var barWidth = box.width() - box.find( 'div' ).width();
      box.remove();
      $('#list-head').css('margin-right', barWidth);

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

   futureDate: function(seconds) {
      var d = new Date();
      d.setSeconds(d.getSeconds() + seconds);
      return d;
   },

   parseResponse: function(data) {
      if (!data ||  !data.responseText) {
         return null;
      }

      // unauthorised
      if (data.status === 401) {
         new Notification({
            type: 'error',
            msg: 'Your session has expired. Please <a href="/login">' +
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

         res.status = data.status;

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
         _id: link.find('._id').text(),
         category: link.find('.category').text(),
         playCount: parseInt(link.find('.play-count').text()),
         obj: link
      };
   },

   clearSearch: function() {
      $('#clear-search').hide();
      $('#search').val('');
      $('.result-list').remove();
   },

   extract: extract
};
