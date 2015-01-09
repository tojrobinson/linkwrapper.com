'use strict';

////
// alt to indexedDB until better supported

var util = require('../util');
var cache = {
   category: {
   },
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
      var from = cache.category[opt.from];
      var to = cache.category[opt.to];

      if (to) {
         to.items[opt.link] = true;
         to.modified = util.futureDate(1);
      }

      if (from) {
         delete from.items[opt.link];
      }
   },

   addLink: function(link) {
      var category = cache.category[link.category];
      if (category) {
         cache.link[link._id] = link;
         category.items[link._id] = true;
         category.modified = util.futureDate(1);
      }
   },

   buildList: function(type, id) {
      if (type === 'category') {
         return this.buildCategory(id);
      } else if (type === 'playlist') {
         return this.buildPlaylist(id);
      }
   },

   buildCategory: function(id) {
      var cachedList = cache.category[id];
      var updatedStore = {};
      var list = [];

      if (!cachedList) {
         return [];
      }

      if (!cachedList.items) {
         cachedList.items = {};
         return [];
      }
   
      for (var i in cachedList.items) {
         var link = cache.link[i];
         if (link && link.category === id) {
            list.push(link);
            updatedStore[i] = true;
         }
      }

      // lazy update
      this.setItem('category', id, {
         items: updatedStore,
         modified: new Date()
      });

      return list;
   },

   buildPlaylist: function(id) {
      var cachedList = cache.playlist[id];
      var list = [];
      var updatedStore = [];

      if (!cachedList) {
         return [];
      }

      if (cachedList.items) {
         cachedList.items.forEach(function(i) {
            var link = cache.link[i.link];

            if (link) {
               list.push({
                  link: link,
                  order: i.order
               });

               updatedStore.push(i);
            }
         });

         // lazy update
         this.setItem('playlist', id, {
            items: updatedStore,
            modified: new Date()
         });
      }

      list.sort(function(a, b) {
         return a.order - b.order;
      });

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
