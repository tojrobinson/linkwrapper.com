'use strict';

module.exports = {
   serialize: function(obj) {
      var o = {};
      var a = obj.serializeArray();
      $.each(a, function() {
         o[this.name] = this.value || '';
      });
      return o;
   }
};
