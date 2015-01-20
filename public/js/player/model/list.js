'use strict';

var ElementManager = require('elman');
var em = new ElementManager();
var util = require('../util');
var cache = require('./dbCache');
var state = {
   activeList: {},
   sort: {
      sorted: false,
      descending: false,
      column: null
   },
   search: 'local',
   staged: false
};

module.exports = {
   init: function(views) {
      this.views = views;
      var active = $('#library .selected');

      state.activeList = {
         type: 'category',
         name: active.find('.title-wrap').text(),
         id: active.find('.id').val(),
         length: 0,
         obj: active
      };

      this.loadList();
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;

      // notify views
      var changed = {
         sort: function() {
            this.views.list.render();
         },

         activeList: function() {
            this.loadList();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   loadList: function() {
      var views = this.views;
      var that = this;
      var list = state.activeList;
      var cached = cache.getItem(list.type, list.id);
      var reqData = {
         id: list.id
      };

      if (cached) {
         reqData.m = cached.modified;
      }

      state.sort = {
         sorted: false,
         descending: false,
         column: null
      };

      if (!state.activeList.id) {
         em.clear();
         return false;
      }

      views.list.render();

      $.ajax({
         type: 'GET',
         url: '/a/' + list.type,
         data: reqData,
         complete: function(data) {
            em.clear();

            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               return new views.Notification(res);
            }  else if (res.type === 'notmodified') {
               var cachedList = cache.buildList(list.type, list.id);
               state.activeList.length = cachedList.length;
               state.activeList.loaded = true;
               views.list.render(cachedList);
            } else if (res.type === 'success') {
               var items = (list.type === 'category') ? {} : [];

               res.data.forEach(function(link) {
                  if (list.type === 'category') {
                     items[link._id] = true;
                  } else if (list.type === 'playlist') {
                     items.push({
                        order: link.order,
                        link: link.link._id
                     });
                     link = link.link;
                  }

                  cache.setItem('link', link._id, link);
               });

               // normalise sub-second response
               var modified = util.futureDate(1);
               cache.setItem(list.type, list.id, {
                  items: items,
                  modified: modified
               });

               state.activeList.length = res.data.length || 0;
               state.activeList.loaded = true;
               views.list.render(res.data);
            }
            

            em.sync({
               containerId: 'list-body',
               elementType: '.wrapped-link',
               cellType: '.item-content'
            });

            if (state.activeList.type === 'playlist') {
               new Sortable($('#list-body')[0], {
                  ghostClass: 'drag-ghost',
                  draggable: '.wrapped-link',
                  animation: 150,
                  handle: '.grab-link',
                  onEnd: function() {
                     state.staged = true;
                     that.updateOrder();
                  }
               });
            }
         }
      });
   },
   
   deleteLists: function(type, ids, cb) {
      var toDelete = {
         type: type,
         ids: ids 
      };

      $.ajax({
         type: 'POST',
         url: '/a/deleteLists',
         data: toDelete,
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               ids.forEach(function(list) {
                  cache.removeItem(type, list);
               });
               cb(null, res);   
            }
         }
      });
   },

   editLists: function(type, lists, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/editLists',
         data: {
            type: type,
            lists: lists
         },
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res);
            }
         }
      });
   },

   syncPlaylist: function(cb) {
      var links = [];
      var playlist = state.activeList.id;

      em.elements.forEach(function(item) {
         links.push({
            order: $(item.obj).find('.order').text(),
            link: $(item.obj).find('._id').text()
         });
      });

      $.ajax({
         type: 'POST',
         url: '/a/syncPlaylist',
         contentType: 'application/json',
         data: JSON.stringify({
            playlist: playlist,
            links: links 
         }),
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error' && cb) {
               return cb(res);
            }
            
            state.staged = false;
            cache.setItem('playlist', playlist, {
               items: links,
               modified: util.futureDate(1)
            });

            if (cb) {
               cb(null);
            }
         }
      });
   },

   addList: function(type, list, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/addList',
         data: {type: type, list: list},
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res.data.id);
            }
         }
      });
   },

   updateOrder: function() {
      if (state.activeList.type !== 'playlist') return;

      em.mutated({threshold: 1});
      var links = em.elements;
      var order = 1;

      for (var i = 0; i < links.length; ++i) {
         $(links[i].obj).find('.order').text(order++);
      }
   },

   mutated: function(opt) {
      opt = opt || {};
      em.mutated(opt);
   },

   sort: function(opt) {
      em.sort(opt);
   },

   search: function(opt) {
      em.search(opt);
   },

   extract: function(file, types, category, cb) {
      var fr = new FileReader();
      var active = state.activeList;
      var that = this;

      fr.onload = function(e) {
         util.extract({
            content: e.target.result,
            types: types
         }, function(err, extracted) {
            if (!extracted.links.length) {
               return cb({
                  msg: 'No supported links found.'
               });
            }

            $.ajax({
               type: 'POST',
               url: '/a/addManyLinks',
               contentType: 'application/json',
               data: JSON.stringify({
                  category: category,
                  links: extracted.links
               }),
               complete: function(data) {
                  var res = util.parseResponse(data);

                  if (!res) {
                     return false;
                  }

                  if (active.type === 'category' && active.id === category) {
                     that.loadList();
                  }

                  if (res.type === 'error' && !res.data) {
                     cb(res);
                  } else {
                     cb(null, res);
                     em.mutated();
                  }
               }
            });
         });
      };

      fr.readAsText(file, 'utf-8');
   },

   addToPlaylist: function(playlist, links, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/addToPlaylist',
         data: {id: playlist, links: links},
         complete: function(data) {

            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res);
            }
         }
      });
   },

   addLink: function(form, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/addLink',
         data: form.find(':input').serialize(),
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cache.addLink(res.data);
               cb(null, res);
               em.mutated();
            }
         }
      });
   },

   editLink: function(form, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/editlink',
         data: form.find(':input').serialize(),
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               return cb(res);
            }

            var updated = util.serialize(form);
            var link = cache.getItem('link', updated._id);

            if (link.category !== updated.category) {
               cache.moveLink({
                  link: link._id,
                  from: link.category,
                  to: updated.category
               });
            }

            for (var u in updated) {
               link[u] = updated[u];
            }

            cache.setItem('link', updated._id, link);
            cache.modified('category', link.category);

            cb(null, updated);

            em.mutated({
               threshold: 10
            });

            // update duplicates
            if (state.activeList.type === 'playlist') {
               var linkId = updated._id;
               em.elements.forEach(function(el) {
                  var item = $(el.obj);
                  if (item.find('._id').text() === linkId) {
                     item.find('.title').text(updated.title);
                     item.find('.artist').text(updated.artist);
                     item.find('.other').text(updated.other);
                     item.find('.url').text(updated.url);
                  }
               });
            }
         }
      });
   },

   deleteLinks: function(from, linkIds, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/deleteLinks',
         data: {
            from: from,
            linkIds: linkIds
         },
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) return false;

            if (res.type === 'error') {
               cb(res);
            } else {
               linkIds.forEach(function(id) {
                  cache.removeItem('link', id);
               });

               cache.modified('category', from);
               cb(null);
            }
         } 
      });
   },

   removeFromPlaylist: function(id, positions, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/removeFromPlaylist',
         data: { id: id, positions: positions },
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res);
            }
         }
      });
   }
};
