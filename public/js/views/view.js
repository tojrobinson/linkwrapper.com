'use strict';

var model = require('../model');

var View = function() {
   this.init.apply(this, arguments);
   if (this.events && typeof this.events === 'object') {
      Object.keys(this.events).forEach(function(key) {
         var that = this;
         var type = key.substr(0, key.indexOf(' '));
         var target = key.substr(key.indexOf(' ') + 1);
         var action = this.events[key];
         $(target, this.el).on(type, function(e) {
            that[action].call(that, e);
         });
      }, this);
   }
}

module.exports = View;

View.prototype = {
   model: model,

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
