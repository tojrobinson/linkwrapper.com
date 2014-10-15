'use strict';

var Base = function() {
   this.init.apply(this, arguments);
}

module.exports = Base;

Base.prototype = {
   init: function() {

   }
};

Base.extend = function extend(members) {
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
