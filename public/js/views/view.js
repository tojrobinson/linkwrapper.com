'use strict';

var View = function() {
   this.init.apply(this, arguments);

   if (this.events && typeof this.events === 'object') {
      var that = this;
      Object.keys(this.events).forEach(function(key) {
         var type = key.substr(0, key.indexOf(' '));
         var target = key.substr(key.indexOf(' ') + 1);
         var action = this.events[key];

         if (target === 'window') {
            $(window).on(type, function(e) {
               that[action].call(that, e, $(this));
            });
         } else {
            $(that.el).on(type, target, function(e) {
               that[action].call(that, e, $(this));
            });
         }
      }, this);
   }
}

module.exports = View;

View.prototype = {
   model: require('../model'),

   init: function() {

   }
};

View.extend = function extend(members) {
   var Parent = this;
   var Child = function() {
      Parent.apply(this, arguments);
   }

   Child.prototype = Object.create(Parent.prototype);

   for (var m in members) {
      Child.prototype[m] = members[m];
   }

   Child.extend = extend;

   return Child;
}
