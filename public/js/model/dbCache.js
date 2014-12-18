'use strict';

/* alt to indexedDB until better supported */

var util = require('../util');
var cache = {
   category: {},
   playlist: {},
   link: {
      // map id -> link object
   }
};

module.exports = {
   getStore: function(store) {
      return cache[store];
   },

   getItem: function(store, key) {
      return cache[store] ? cache[store][key] : null;
   },

   setItem: function(store, key, val) {
      if (cache[store]) {
         cache[store][key] = val;
      }
   },

   removeItem: function(store, key) {
      if (cache[store]) {
         delete cache[store][key];
      }
   },

   modified: function(store, key) {
      if (cache[store] && cache[store][key]) {
         cache[store][key].modified = util.futureDate(1);
      }
   },

   moveLink: function(opt) {
      var category = cache.category[opt.to];

      if (category) {
         category.items.unshift({
            link: opt.link
         });

         category.modified = util.futureDate(1);
      }

      if (opt.from in cache.category) {
         cache.category[opt.from].modified = util.futureDate(1);
      }
   },

   addLink: function(link) {
      cache.link[link._id] = link;
      if (link.category in cache.category) {
         cache.category[link.category].items.unshift({
            link: link._id
         });
      }
   },

   buildList: function(type, id) {
      var list = [];
      var updatedStore = [];
      var cachedList = this.getItem(type, id);
      var order = 1;

      if (cachedList && cachedList.items) {
         cachedList.items.forEach(function(i) {
            var link = cache.link[i.link];

            // filter dead links
            if (!cache.category[link.category]) {
               delete cache.link[i.link];
               link = null;
            }

            if (link) {
               if (type === 'playlist') {
                  link = {
                     link: link,
                     order: i.order
                  };
               }

               // filter moved links
               if (type !== 'category' || link.category === id) {
                  list.push(link);
                  updatedStore.push(i);
               }
            }
         });

         // lazy update
         this.setItem(type, id, {
            items: updatedStore,
            modified: new Date()
         });
      }

      if (type === 'playlist') {
         list.sort(function(a, b) {
            a.order - b.order;
         });
      }

      return list;
   },

   // override
   toString: function(store) {
      var str = '';

      if (store) {
         str += store + ' store:\n';
         str += (cache[store]) ? JSON.stringify(cache[store], undefined, 2) : '';
         return str;
      }

      for (var s in cache) {
         str += s + ' store:\n';
         str += JSON.stringify(cache[s], undefined, 2);
      }

      return str;
   }
};
