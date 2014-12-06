'use strict';

var ElementManager = require('elman');
var em = new ElementManager();
var util = require('../util');
var extract = require('./extractor');
var state = {
   activeList: {},
   minBar: false,
   forceMinBar: false,
   menuProtect: false,
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
         forceMinBar: function() {
            state.minBar = state.forceMinBar;
            this.views.sideBar.render();
         },

         activeList: function() {
            this.loadList();
         },

         sort: function() {
            this.views.list.render();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   extract: function(file, category, cb) {
      var fr = new FileReader();
      var active = state.activeList;
      var that = this;

      fr.onload = function(e) {
         extract(e.target.result, function(err, extracted) {
            if (extracted.links.length) {
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

                     if (res.type === 'error') {
                        cb(res);
                     } else {
                        cb(null, res);
                        em.mutated();
                     }
                  }
               });
            } else {
               cb({
                  msg: 'No supported links found.'
               });
            }
         });
      };

      fr.readAsText(file, 'utf-8');
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
               cb(null, res);
               em.mutated();
            }
         }
      });
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
               cb(res);
            } else {
               var updated = util.serialize(form);
               cb(null, updated);

               em.mutated({
                  threshold: 10
               });

               // update duplicates
               if (state.activeList.type === 'playlist') {
                  var linkId = updated.id;
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
         }
      });
   },

   deleteLinks: function(linkIds, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/deleteLinks',
         data: {linkIds: linkIds},
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) return false;

            if (res.type === 'error') {
               cb(res);
            } else {
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
   },

   loadList: function() {
      var views = this.views;
      var that = this;

      state.sort = {
         sorted: false,
         descending: false,
         column: null
      };

      if (!state.activeList.id) {
         em.clear();
         return false;
      }

      views.list.render(null, true);

      $.ajax({
         type: 'GET',
         url: '/a/' + state.activeList.type,
         data: {id: state.activeList.id},
         complete: function(data) {
            em.clear();

            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               new views.Notification(res);
            } else if (res.type === 'success') {
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

            state.activeList.length = em.elements.length;
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
            playlist: state.activeList.id,
            links: links 
         }),
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (cb) {
               if (res.type === 'error') {
                  cb(res);
               } else {
                  state.staged = false;
                  cb(null);
               }
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

   sort: function(opt) {
      em.sort(opt);
   },

   search: function(opt) {
      em.search(opt);
   }
};
