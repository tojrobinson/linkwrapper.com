'use strict';

var View = function() {
   this.init.apply(this, arguments);

   if (this.events && typeof this.events === 'object') {
      var that = this;
      Object.keys(this.events).forEach(function(key) {
         var type = key.substr(0, key.indexOf(' '));
         var target = key.substr(key.indexOf(' ') + 1);
         target = (target === 'window') ? window : target;
         var action = this.events[key];

         $(target, that.el).on(type, function(e) {
            that[action].call(that, e);
         });
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
