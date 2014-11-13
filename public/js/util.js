'use strict';

var cooling = false;

module.exports = {
   serialize: function(obj) {
      var o = {};
      var a = obj.serializeArray();
      $.each(a, function() {
         o[this.name] = this.value || '';
      });
      return o;
   },

   clearState: function() {
      $('.static-menu').hide();
      $('.dynamic-menu').remove();
      $('.wrapped-link').removeClass('selected');
   },

   buildModel: function(link) {
      link = link.closest('.wrapped-link');
      return {
         title: link.find('.title').text(),
         artist: link.find('.artist').text(),
         other: link.find('.other').text(),
         url: link.find('.url').text(),
         id: link.find('._id').text(),
         category: link.find('.category').text(),
         playCount: link.find('.play-count').text(),
         obj: link
      };
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
   }
};
