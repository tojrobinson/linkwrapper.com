(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/tully/www/linkwrapper.com/node_modules/elman/index.js":[function(require,module,exports){
'use strict';

module.exports = ElementManager;

function ElementManager() {
   if (!(this instanceof ElementManager))
      return new ElementManager();

   this.container = null;
   this.elementType = null;
   this.cellType = null;
   this.sortState = null;
   this.mutations = 0;
   this.elements = [];
   this.sortList = [];
}

function hideAll() {
   for (var i = 0; i < this.elements.length; ++i) {
      this.elements[i].obj.style.display = 'none';
   }
}

function resyncElements() {
   // this.elements.length = 0;
   this.elements = [];
   this.sortState.buildList = true;
   this.mutations = 0;

   var elements = this.container.querySelectorAll(this.elementType),
       currElement,
       cells,
       values;

   for (var i = 0; i < elements.length; ++i) {
      currElement = elements[i];

      if (!this.cellType) {
         values = [currElement.innerText || currElement.textContent || ''];
      } else {
         values = [];
         cells = currElement.querySelectorAll(this.cellType);
         for (var j = 0; j < cells.length; ++j) {
            values.push(cells[j].innerText || cells[j].textContent || '');
         }
      }

      this.elements.push({
         obj: elements[i],
         values: values,
         visible: true
      });
   }
}

ElementManager.prototype.clear = function() {
   if (this.container && this.container.childNodes.length) {
      while (this.container.childNodes.length > 0) {
         this.container.removeChild(this.container.firstChild);
      }
   }
}

ElementManager.prototype.sync = function(opt) {
   opt = opt || {};
   if (!opt.containerId || !opt.elementType) {
      throw new Error('[elman] must specify containerId and elementType');
   } else if (opt.elementType === opt.cellType) {
      throw new Error('[elman] elementType and cellType must be unique');
   }

   // TODO
   // if future:
   //    add mutation object
   this.container = document.getElementById(opt.containerId);
   this.elementType = opt.elementType;
   this.cellType = opt.cellType;
   this.sortState = {focusCell: null, order: -1, buildList: true};
   this.mutations = 0;
   this.elements = [];
   this.sortList = [];

   var elements = this.container.querySelectorAll(opt.elementType),
       currElement,
       cells,
       values;

   for (var i = 0; i < elements.length; ++i) {
      currElement = elements[i];

      if (!this.cellType) {
         values = [currElement.innerText || currElement.textContent || ''];
      } else {
         values = [];
         cells = currElement.querySelectorAll(this.cellType);
         for (var j = 0; j < cells.length; ++j) {
            values.push(cells[j].innerText || cells[j].textContent || '');
         }
      }

      this.elements.push({
         obj: elements[i],
         values: values,
         visible: true
      });
   }
}

ElementManager.prototype.mutated = function(opt) {
   opt = opt || {};
   ++this.mutations;
   // resync now else on next sort/search
   if ((opt.threshold > 0) && (this.mutations >= opt.threshold)) {
      resyncElements.call(this);
   }
}

ElementManager.prototype.sort = function(opt) {
   opt = opt || {};
   var cell = opt.cell || 0,
       order,
       i, 
       len;

   if (this.elements.length) {
      if (cell < 0 || cell >= this.elements[0].values.length) {
         throw new Error('[elements.js] Invalid sort cell.');
      }
   }

   // check for unsynced mutations
   if (this.mutations) {
      resyncElements.call(this);
   }

   if (this.sortState.buildList || (this.sortState.focusCell !== cell)) {
      this.sortState.focusCell = cell;
      this.sortState.buildList = false;
      this.sortList = [];
      for (i = 0; i < this.elements.length; ++i) {
         // only sort visible
         if (this.elements[i].visible) {
            this.sortList.push(this.elements[i]);
         }
      }
   }

   order = this.sortState.order *= -1;

   this.sortList.sort(function(a, b) {
      a = a.values[cell];
      b = b.values[cell];
      if (opt.numeric || false) {
         return (b - a)*order;
      } else {
         return a.localeCompare(b)*order;
      }
   }); 

   for (i = 0, len = this.sortList.length; i < len; ++i) {
      this.container.appendChild(this.sortList[i].obj);
   }
}

ElementManager.prototype.search = function(opt) {
   opt = opt || {};
   var pattern = new RegExp(opt.term.replace(/[$^*+?.-\/\\|()[\]{}]/g, '\\$&'), 'i'),
       currElement,
       allCells,
       cells,
       i,
       len;

   // check for unsynced mutations
   if (this.mutations) {
      resyncElements.call(this);
   }

   // notify sort
   this.sortState.buildList = true;

   for (i = 0, len = this.elements.length; i < len; ++i) {
      currElement = this.elements[i];
      currElement.visible = false;
      if (opt.cells) {
         var toSearch = '';

         opt.cells.forEach(function(cell) {
            toSearch += currElement.values[cell];
         });

         if(toSearch.match(pattern)) {
            this.elements[i].visible = true;
         }
      } else { // default to all cells
         allCells = currElement.values.join('');
         if (allCells.match(pattern)) {
            this.elements[i].visible = true;
         }
      }
   }

   hideAll.call(this);

   for (i = 0, len = this.elements.length; i < len; ++i) {
      if (this.elements[i].visible) {
         this.elements[i].obj.style.display = '';
      }
   }
}

},{}],"/home/tully/www/linkwrapper.com/node_modules/link-id/index.js":[function(require,module,exports){
'use strict';

module.exports = function(url) {
   var match = null;
   var info = null;

   // patterns
   var youTube = /youtu.*(?:(?:\.be|v|embed)\/|watch\?.*v=)([^#&?]*).*/i;
   var vimeo = /vimeo.com.*\/(\d+)/i;
   var soundCloud = /soundcloud.com\/([^?]+)/i;

   if (match = youTube.exec(url)) {
      info = {
         id: match[1],
         type: 'youtube'
      };
   } else if (match = vimeo.exec(url)) {
      info = {
         id: match[1],
         type: 'vimeo'
      };
   } else if (match = soundCloud.exec(url)) {
      info = {
         id: match[1],
         type: 'soundcloud'
      };
   }

   return info;
}

},{}],"/home/tully/www/linkwrapper.com/node_modules/watchify/node_modules/browserify/node_modules/events/events.js":[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],"/home/tully/www/linkwrapper.com/public/js/player/index.js":[function(require,module,exports){
'use strict';

var UI = require('./views/static');
var model = require('./model');
var util = require('./util');
var ui = new UI();

model.init(ui);
util.init(ui.Notification);

},{"./model":"/home/tully/www/linkwrapper.com/public/js/player/model/index.js","./util":"/home/tully/www/linkwrapper.com/public/js/player/util/index.js","./views/static":"/home/tully/www/linkwrapper.com/public/js/player/views/static.js"}],"/home/tully/www/linkwrapper.com/public/js/player/model/dbCache.js":[function(require,module,exports){
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

},{"../util":"/home/tully/www/linkwrapper.com/public/js/player/util/index.js"}],"/home/tully/www/linkwrapper.com/public/js/player/model/index.js":[function(require,module,exports){
'use strict';

var player = require('./player');
var user = require('./user');
var list = require('./list');
var ui = require('./ui');

module.exports = {
   init: function(views) {
      // inject views
      player.init(views);
      user.init(views);
      list.init(views);
      ui.init(views);
   },
   player: player,
   user: user,
   list: list,
   ui: ui
};

},{"./list":"/home/tully/www/linkwrapper.com/public/js/player/model/list.js","./player":"/home/tully/www/linkwrapper.com/public/js/player/model/player.js","./ui":"/home/tully/www/linkwrapper.com/public/js/player/model/ui.js","./user":"/home/tully/www/linkwrapper.com/public/js/player/model/user.js"}],"/home/tully/www/linkwrapper.com/public/js/player/model/list.js":[function(require,module,exports){
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

      views.list.render(null, true);

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

},{"../util":"/home/tully/www/linkwrapper.com/public/js/player/util/index.js","./dbCache":"/home/tully/www/linkwrapper.com/public/js/player/model/dbCache.js","elman":"/home/tully/www/linkwrapper.com/node_modules/elman/index.js"}],"/home/tully/www/linkwrapper.com/public/js/player/model/player.js":[function(require,module,exports){
'use strict';

var manager = require('./sites/manager');
var user = require('./user');
var util = require('../util');
var sites = require('./sites');
var linkId = require('link-id');
var views = null;
var cache = require('./dbCache');
var state = {
   shuffle: false,
   repeat: false,
   playing: {},
   height: 300,
   active: 'youtube',
   started: false,
   related: {}
};

function play(link) {
   if (!link) {
      return false;
   } else if (link instanceof jQuery) {
      link = util.buildLink(link);
   }

   var details = linkId(link.url);

   if (details) {
      if (state.active !== details.type) {
         var currPlayer = manager.getPlayer(state.active);

         if (currPlayer) {
            currPlayer.stop();
         }

         state.active = details.type;
         views.player.render();
      }

      var player = manager.getPlayer(details.type);

      if (player) {
         player.load(details.id);
      }

      state.playing = link;
      state.started = true;
      views.player.playing.render();

      if (link.type === 'main') {
         addPlay(link._id);
      }
   } else if (link.type === 'main') {
      link.obj.addClass('link-error');
      return play(nextLink(link.obj));
   }
}

function nextLink(link) {
   link = link || state.playing.obj;
   if (!link) return null;
   var next = link.nextAll('.wrapped-link:visible')
                  .first();

   return (next.length) ? next : null;
}

function addPlay(id) {
   $.ajax({
      type: 'POST',
      url: '/a/addPlay',
      data: {_id: id},
      complete: function() {
         cache.getItem('link', id).playCount++;
      }
   });
}

module.exports = {
   init: function(ui) {
      views = ui;
      manager.setContainer('player');
      manager.addPlayer(new sites.YouTube('youtube'));
      manager.addPlayer(new sites.Vimeo('vimeo'));

      manager.on('ended', function(e) {
         if (state.repeat) {
            play(state.playing);
         } else if (state.shuffle) {
            var links = $('.wrapped-link:visible');
            var index = Math.floor(Math.random() * links.length);
            var randomLink = $(links[index]);
            var search = 0;

            while (!randomLink && (++search < links.length)) {
               index = (index + search) % links.length;
               randomLink = $(links[index]);
            }

            play(randomLink);
         } else {
            play(nextLink());
         }
      });

      manager.on('error', function(e) {
         if (state.playing.obj) {
            state.playing.obj.addClass('link-error');
            play(nextLink());
         }
      });

      manager.on('playing', function(e) {
         if (state.started) {
            var details  = linkId(e.url);
            var settings = user.get('settings');

            if (!settings.suggestions) {
               return;
            }

            var player = manager.getPlayer(settings.suggestions);
            var opt = {};

            if (details && settings.suggestions === details.type) {
               opt = {
                  id: details.id,
                  type: 'related'
               };
            } else {
               // fallback to default search on player / source mimatch
               opt = {
                  term: state.playing.artist || state.playing.title,
                  type: 'default'
               };
            }

            player.search(opt, function(results) {
               if (results) {
                  state.related = results;
                  state.started = false;
                  views.player.suggestions.render();
               }
            });
         }
      });
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;
      var player = views.player;

      // notify views
      var changed = {
         height: function() {
            player.render();
         },

         playing: function() {
            player.playing.render();
         },

         active: function() {
            player.render();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   play: play,

   search: function(player, term, cb) {
      manager.getPlayer(player)
             .search(term, cb);
   }
};

},{"../util":"/home/tully/www/linkwrapper.com/public/js/player/util/index.js","./dbCache":"/home/tully/www/linkwrapper.com/public/js/player/model/dbCache.js","./sites":"/home/tully/www/linkwrapper.com/public/js/player/model/sites/index.js","./sites/manager":"/home/tully/www/linkwrapper.com/public/js/player/model/sites/manager.js","./user":"/home/tully/www/linkwrapper.com/public/js/player/model/user.js","link-id":"/home/tully/www/linkwrapper.com/node_modules/link-id/index.js"}],"/home/tully/www/linkwrapper.com/public/js/player/model/sites/index.js":[function(require,module,exports){
'use strict';

module.exports = {
   YouTube: require('./youTube'),
   Vimeo: require('./vimeo')
};

},{"./vimeo":"/home/tully/www/linkwrapper.com/public/js/player/model/sites/vimeo.js","./youTube":"/home/tully/www/linkwrapper.com/public/js/player/model/sites/youTube.js"}],"/home/tully/www/linkwrapper.com/public/js/player/model/sites/manager.js":[function(require,module,exports){
'use strict';

var emitter = new (require('events').EventEmitter);
var container = null;
var players = {};

function emit(type, data) {
   emitter.emit(type, data);
}

module.exports = {
   addPlayer: function(player) {
      player.init(container, emit);
      players[player.id] = player;
   },

   on: function(type, action) {
      emitter.on(type, action);
   },

   getPlayer: function(type) {
      return players[type];
   },

   action: function(player, type, args) {
      try {
         players[player][type](args);
      } catch (e) {
         return null;
      }

      return true;
   },

   setContainer: function(containerId) {
      container = document.getElementById(containerId);
      if (container === null) {
         throw new Error('[PlayerManager] Container ID does not exist: ' + containerId);
      }
   },

   clearContainer: function() {
      if (container && container.childNodes.length) {
         while (container.childNodes.length > 0) {
            container.removeChild(container.firstChild);
         }
      }
   }
};

},{"events":"/home/tully/www/linkwrapper.com/node_modules/watchify/node_modules/browserify/node_modules/events/events.js"}],"/home/tully/www/linkwrapper.com/public/js/player/model/sites/vimeo.js":[function(require,module,exports){
'use strict';

var Vimeo = function(playerId) {
   this.id = playerId;
   this.container = null;
   this.player = null;
}

module.exports = Vimeo;

Vimeo.prototype.init = function(container, emit) {
   var id = this.id;
   this.container = container;
   this.emit = emit;
   var iframe = $('<iframe>').attr({
      id: id,
      src: '',
      height: '100%',
      width: '100%',
      frameborder: '0'
   }).css({
      display: 'none',
      position: 'absolute',
      top: '0',
      left: '0'
   });
   $(container).append(iframe)
}

Vimeo.prototype.load = function(videoId) {
   var embedStr = 'https://player.vimeo.com/video/' + videoId +
                  '?api=1&player_id=' + this.id + '&autoplay=1' +
                  '&title=0';
   var iframe = $('#' + this.id, '#player');
   iframe.attr('src', embedStr);

   // load api late as per vimeo docs
   if (!this.player) {
      this.player = $f(iframe[0]);
      var that = this;

      this.player.addEvent('ready', function() {
         that.player.addEvent('finish', function() {
            that.emit('ended', {
               url: that.player.api('getVideoUrl')
            });
         });

         that.player.addEvent('play', function() {
            that.emit('playing', {
               url: that.player.api('getVideoUrl')
            });
         });
      });
   }
}

Vimeo.prototype.play = function() {
   this.player.api('play');
}

Vimeo.prototype.stop = function() {
   //this.player.api('unload');
   $('#' + this.id, '#player').attr('src', '');
}

Vimeo.prototype.pause = function() {
   this.player.api('pause');
}

Vimeo.prototype.getPlaying = function() {
   var player = this.player;
   return {
      url: player.api('getVideoUrl')
   };
}

Vimeo.prototype.getDetails = function(id, cb) {
   // TODO
}

Vimeo.prototype.search = function(term, cb) {
   // TODO
}

},{}],"/home/tully/www/linkwrapper.com/public/js/player/model/sites/youTube.js":[function(require,module,exports){
'use strict';

var API_KEY = 'AIzaSyAmrt-iTLV-IZbgvNZ5TxhEKUVme41O2Us';
var API_URL = 'https://www.googleapis.com/youtube/v3/';

var YouTube = function (playerId) {
   this.id = playerId;
   this.container = null;
   this.player = null;
}

module.exports = YouTube;

YouTube.prototype.init = function(container, emit) {
   var settings = {
      height: '100%',
      width: '100%',
      playerVars: {
         showinfo: 0,
         wmode: 'opaque',
         html5: 1 // fix permission denied error in FF
      },

      events: {
         onStateChange: function(e) {
            if (e.data === YT.PlayerState.PLAYING) {
               var url = e.target.getVideoUrl();
               emit('playing', {
                  url: url,
                  time: e.target.getDuration()
               });
            } else if (e.data === YT.PlayerState.ENDED) {
               emit('ended', {
                  url: e.target.getVideoUrl()
               });
            } else if (e.data === YT.PlayerState.PAUSED) {
               emit('paused', {
                  url: e.target.getVideoUrl()
               });
            }
         },

         onError: function(e) {
            var errorTypes = {
               2: 'invalid parameter',
               5: 'html5 error',
               100: 'not found',
               101: 'cannot embed',
               150: 'cannot embed'
            };

            emit('error', {
               message: errorTypes[e.data]
            });
         }
      }
   };

   if (window.YT) {
      this.player = new YT.Player(this.id, settings);
   } else {
      var resource = document.createElement('script');
      var target = document.createElement('div');
      var mount = document.getElementsByTagName('script')[0];
      var that = this;

      window.onYouTubeIframeAPIReady = function() {
         that.player = new YT.Player(that.id, settings);
      }

      resource.src = 'https://www.youtube.com/iframe_api';
      mount.parentNode.insertBefore(resource, mount);
      target.id = this.id;
      container.appendChild(target);
   }
}

YouTube.prototype.load = function(videoId) {
   this.player.loadVideoById(videoId);
}

YouTube.prototype.play = function() {
   this.player.playVideo();
}

YouTube.prototype.stop = function() {
   this.player.stopVideo();
}

YouTube.prototype.pause = function() {
   this.player.pauseVideo();
}

YouTube.prototype.getPlaying = function() {
   var player = this.player;
   return {
      url: player.getVideoUrl()
   };
}

YouTube.prototype.getDetails = function(id, cb) {
   // TODO
}

YouTube.prototype.search = function(opt, cb) {
   var url = API_URL + 'search?part=snippet&maxResults=20&type=video&key=' + API_KEY; 

   if (opt.type === 'related') {
      url += '&relatedToVideoId=' + opt.id;
   } else {
      url += '&q=' + opt.term;
   }

   $.ajax({
      type: 'get',
      url: url,
      complete: function(data) {
         var res = {};
         var results = {};
         var id = 0;

         try {
            res = $.parseJSON(data.responseText);
         } catch (e) {
            res.items = [];
         }

         res.items = res.items || [];

         res.items.forEach(function(i) {
            var info = i.snippet;
            var artist = info.title.substr(0, info.title.indexOf('-'));
            var title = info.title.substr(info.title.indexOf('-') + 1);
            results[id] = {
               id: id++,
               url: 'https://www.youtube.com/watch?v=' + i.id.videoId,
               title: title,
               artist: artist,
               other: '',
               description: info.description,
               thumb: info.thumbnails.default.url,
               channel: info.channelTitle
            };
         });

         cb(results);
      }
   });
}

},{}],"/home/tully/www/linkwrapper.com/public/js/player/model/ui.js":[function(require,module,exports){
'use strict';

var state = {
   minBar: false,
   forceMinBar: false,
   menuProtect: false,
   cooling: false
};

module.exports = {
   init: function(views) {
      this.views = views;
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      state[key] = val;

      var changed = {
         forceMinBar: function() {
            state.minBar = state.forceMinBar;
            this.views.sideBar.render();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   cooldown: function() {
      if (state.cooling) {
         return true;
      }

      state.cooling = true;
      setTimeout(function() {
         state.cooling = false;
      }, 500);

      return false;
   }
};

},{}],"/home/tully/www/linkwrapper.com/public/js/player/model/user.js":[function(require,module,exports){
'use strict';

var util = require('../util');
var views = null;
var state = {
   display: '',
   type: '',
   email: '',
   theme: 'light',
   settings: {
      suggestions: 'youtube',
      theme: 'light',
      sideBar: 'default'
   },
   categories: [],
   playlists: []
};

module.exports = {
   init: function(ui) {
      views = ui;
      this.getUser(function(err, user) {
         if (user) {
            for (var item in user) {
               state[item] = user[item];
            }
            $('#display').text(user.display);
         }
      });

      this.getUserLists(function(err, lists) {
         if (lists) {
            state.categories = lists.categories;
            state.playlists = lists.playlists;
         } else { // fallback update model manually
            $('.list-title', '#category-titles').each(function(i) {
               var name = $(this).find('.title-wrap').text();
               var id = $(this).find('.id').val();

               state.categories.push({
                  name: name,
                  id: id,
                  order: i
               });
            });

            $('.list-title', '#playlist-titles').each(function(i) {
               var name = $(this).find('.title-wrap').text();
               var id = $(this).find('.id').val();
               state.playlists.push({
                  name: name,
                  id: id,
                  order: i
               });
            });
         }

         if (state.categories.length > 6) {
            views.sideBar.categories.render();
         }

         views.sideBar.playlists.render();
      });
   },

   get: function(key) {
      return state[key];
   },

   set: function(key, val) {
      var sideBar = views.sideBar;

      if (key === 'settings') {
         for (var field in val) {
            state.settings[field] = val[field];
         }
      } else {
         state[key] = val;
      }

      var changed = {
         playlists: function() {
            sideBar.playlists.render();
         },

         categories: function() {
            sideBar.categories.render();
         }
      };

      if (changed[key]) {
         changed[key].call(this);
      }
   },

   getUser: function(cb) {
      $.ajax({
         type: 'GET',
         url: '/a/getUser',
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               cb(null, res.data);
            }
         }
      });
   },

   getUserLists: function(cb) {
      $.ajax({
         type: 'GET',
         url: '/a/getUserLists',
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error') {
               cb(res);
            } else {
               var lists = res.data;

               lists.categories.forEach(function(list) {
                  list.id = list._id;
               });

               lists.playlists.forEach(function(list) {
                  list.id = list._id;
               });

               cb(null, lists);
            }
         }
      });
   },

   editUser: function(edit, cb) {
      $.ajax({
         type: 'POST',
         url: '/a/editUser',
         contentType: 'application/json',
         data: JSON.stringify(edit),
         complete: function(data) {
            var res = util.parseResponse(data);

            if (!res) {
               return false;
            }

            if (res.type === 'error' && cb) {
               cb(res);
            } else {
               cb(null, res)
            }
         }
      });
   }
};

},{"../util":"/home/tully/www/linkwrapper.com/public/js/player/util/index.js"}],"/home/tully/www/linkwrapper.com/public/js/player/util/extractor.js":[function(require,module,exports){
'use strict';

var parseLink = require('link-id');

function getInfo(title) {
   var parts = title.replace(/(?:^\W+|-\s*YouTube\s*$)/gi, '').split('-');
   if (parts.length > 1) {
      return {
         artist: parts[0].trim(),
            title: parts.slice(1).join('-').trim()
      };
   } else {
      return {
         artist: '',
            title: parts[0]
      };
   }
}

module.exports = function(opt, cb) {
   var extraction = new RegExp('href="(.*?)".*?>(.*?)<', 'i');
   var content = opt.content;
   var results = {
      found: 0,
      filtered: 0,
      links: []
   };

   if (!content || typeof content !== 'string') {
      return cb(null, results);
   }

   content.split('\n').forEach(function(line) {
      var details = extraction.exec(line);

      if (details) {
         var url = details[1];
         var info = getInfo(details[2]);
         var link = parseLink(url);
         results.found++;

         if (link && link.type in opt.types) {
            results.links.push({
               title: info.title,
               artist: info.artist,
               url: url
            });
         } else {
            results.filtered++;
         }
      }
   });

   cb(null, results);
}

},{"link-id":"/home/tully/www/linkwrapper.com/node_modules/link-id/index.js"}],"/home/tully/www/linkwrapper.com/public/js/player/util/index.js":[function(require,module,exports){
'use strict';

var Notification = null;
var preload = require('./preload');
var extract = require('./extractor');

module.exports = {
   UNAUTHORIZED: 401,
   SUCCESS: 0,
   ERROR: 100,

   init: function(notify) {
      // wtf fb
      if (window.location.hash.match(/#.*/)) {
         window.location.hash = '';
         history.pushState('', document.title, window.location.pathname);
      }

      // get bar width
      var box = $( '<div><div></div></div>' )
          .css({
              position: 'absolute',
              left: -1000,
              width: 300,
              overflow: 'scroll'
          })
          .appendTo( 'body' );
      var barWidth = box.width() - box.find( 'div' ).width();
      box.remove();
      $('#list-head').css('margin-right', barWidth);

      preload.all();
      Notification = notify;
   },

   serialize: function(obj) {
      var o = {};
      var a = obj.serializeArray();
      $.each(a, function() {
         o[this.name] = this.value || '';
      });
      return o;
   },

   futureDate: function(seconds) {
      var d = new Date();
      d.setSeconds(d.getSeconds() + seconds);
      return d;
   },

   parseResponse: function(data) {
      if (!data ||  !data.responseText) {
         return null;
      }

      // unauthorised
      if (data.status === 401) {
         new Notification({
            type: 'error',
            msg: 'Your session has expired. Please <a href="/">' +
                 '<strong class="notification-link">login</strong>' +
                 '</a> to use this feature.'
         });

         return null;
      }

      try {
         var res = $.parseJSON(data.responseText);

         if (res.msg) {
            res.msg = Mustache.render(res.msg, res.data);
         }

         res.status = data.status;

         return res;
      } catch (e) {
         return null;
      }
   },

   mongoId: function(id) {
      return typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);
   },

   buildLink: function(link) {
      link = link.closest('.wrapped-link');
      return {
         type: 'main',
         title: link.find('.title').text(),
         artist: link.find('.artist').text(),
         other: link.find('.other').text(),
         url: link.find('.url').text(),
         _id: link.find('._id').text(),
         category: link.find('.category').text(),
         playCount: parseInt(link.find('.play-count').text()),
         obj: link
      };
   },

   extract: extract
};

},{"./extractor":"/home/tully/www/linkwrapper.com/public/js/player/util/extractor.js","./preload":"/home/tully/www/linkwrapper.com/public/js/player/util/preload.js"}],"/home/tully/www/linkwrapper.com/public/js/player/util/preload.js":[function(require,module,exports){
'use strict';

var images = [
   // cloudflare's problem
   '/account.png',
   '/addFile.png',
   '/addSuggestion.png',
   '/cancel.png',
   '/cancelRename.png',
   '/close.png',
   '/expand.png',
   '/finishRename.png',
   '/grabLink.png',
   '/grabList.png',
   '/leftArrowInverse.png',
   '/leftArrow.png',
   '/libraryIconInverse.png',
   '/libraryIcon.png',
   '/playerSettings.png',
   '/playIcon.png',
   '/playing.png',
   '/playlistsIconInverse.png',
   '/playlistsIcon.png',
   '/remove.png',
   '/rename.png',
   '/repeatActive.png',
   '/rightArrowInverse.png',
   '/rightArrow.png',
   '/shuffleActive.png',
   '/sortDown.png',
   '/sortUp.png',
   '/locked.png',
   '/unlocked.png',
   '/soundCloudIcon.png',
   '/vimeoIcon.png',
   '/youTubeCube.png',
   '/bitcoin.png',
   '/octocat.png'
];

module.exports = {
   all: function() {
      images.forEach(function(path) {
         (new Image()).src = '/img' + path;
      });
   }
};

},{}],"/home/tully/www/linkwrapper.com/public/js/player/views/dynamic.js":[function(require,module,exports){
'use strict';

var View = require('./view');
var model = require('../model');
var util = require('../util');

var Modal = View.extend({
   el: $('<form class="theme player-modal">'), // reusable
   cover: $('<div class="view-cover">'),
   render: function(name, model) {
      var template = $('#' + name + '-template').html();
      var rendered = Mustache.render(template, model);
      this.el.html(rendered);

      $('body').append(this.cover)
               .append(this.el);
   },
   unrender: function() {
      this.cover.remove();
      this.el.empty().remove();
   },
   events: {
      'click .close-modal': 'unrender',
      'click .submit': 'save'
   }
});

var ClickMenu = View.extend({
   el: $('<div class="click-menu dynamic-menu">'),
   unrender: function() {
      this.el.empty().remove();
   }
});

var CategorySelect = View.extend({
   el: $('<div>'),

   init: function() {
      var active = model.list.get('activeList');
      var other = [];

      model.user.get('categories').forEach(function(c) {
         var option = {
            name: c.name,
            id: c.id
         };

         if (active.type === 'playlist' || !active.type) {
            other.push(option);
         } else if (c.id !== active.id) {
            other.push({
               name: c.name,
               id: c.id
            });
         }
      });

      this.model = {
         other: other
      };

      if (active.type === 'category') {
         this.model.active = active;
      }

      this.el.empty();
   },

   render: function() {
      var template = $('#select-template').html();
      var rendered = Mustache.render(template, this.model);
      this.el.html(rendered);
      return this.el;
   }
});

var ConfirmModal = Modal.extend({
   init: function(opt) {
      this.model = {
         msg: opt.msg
      };
      this.action = opt.action;
      this.cleanUp = opt.cleanUp;
      this.processing = opt.processing;
      this.render('confirm', this.model);
   },

   save: function(e) {
      e.preventDefault();
      if (this.processing) {
         $('#confirm-modal').val(this.processing);
      }
      this.action();
   },

   unrender: function() {
      if (this.cleanUp) {
         this.cleanUp();
      }
      this.cover.remove();
      this.el.empty().remove();
   }
});

var DetailsModal = Modal.extend({
   init: function(model) {
      var select = new CategorySelect();
      model.categorySelect = select.render().html();

      this.model = model;
      this.render('details', model);
   },

   save: function(e) {
      e.preventDefault();
      var category = this.model.category;
      var link = this.model.obj;
      var that = this;
      var active = model.list.get('activeList');

      model.list.editLink(this.el, function(err, updated) {
         if (err) {
            new Notification(err);
         } else {
            if (active.type === 'category' && updated.category !== category) {
               link.fadeOut(1000, function() {
                  link.remove();
               });
            } else {
               link.find('.title').text(updated.title);
               link.find('.artist').text(updated.artist);
               link.find('.other').text(updated.other);
               link.find('.url').text(updated.url);
            }
            that.unrender();
         }
      });
   }
});

var Link = View.extend({
   el: '#list-body',

   init: function(model) {
      this.model = model;
   },

   render: function() {
      var link = $('<div class="wrapped-link">');
      var template = $('#link-template').html();
      var rendered = Mustache.render(template, this.model);
      link.html(rendered);

      $(this.el).prepend(link);
      link.hide().fadeIn(1000);
   }
});

var Notification = View.extend({
   mount: '#notifications',

   init: function(model) {
      this.msg = model.msg;
      this.el = $('<div class="notify-box">');

      var that = this;
      var style = {
         'error': 'error',
         'default': 'default'
      };

      this.type = style[model.type] || 'default';

      this.render();
      setTimeout(function() {
         that.unrender();
      }, 10000);
   },

   events: {
      'click .close-notification': 'unrender'
   },

   render: function() {
      var message = $('<div class="notify-body">' + this.msg + '</div>');
      var close = $('<div class="close-notification ' + this.type + '">');

      this.el.addClass(this.type)
             .append(message)
             .append(close);

      $(this.mount).append(this.el);
      this.el.hide().fadeIn(500);
   },

   unrender: function() {
      $(this.el).remove();
   }
});

module.exports = {
   AddLinkModal: Modal.extend({
      init: function(model) {
         var select = new CategorySelect();
         this.model = model || {newLink: true};
         this.model.categorySelect = select.render().html();
         this.render('add', this.model);
      },

      events: {
         'input .new-link': 'getDetails'
      },

      save: function(e) {
         e.preventDefault();
         var that = this;

         model.list.addLink(this.el, function(err, res) {
            if (err) {
               new Notification(err);
            } else {
               var linkModel = res.data;
               var newLink = new Link(linkModel);
               var active = model.list.get('activeList');

               if (active.type === 'category' && active.id === linkModel.category) {
                  newLink.render();
               }

               model.list.get('activeList').length++;
               $('#add-playing').hide();
               $('#empty-list').hide();
               that.unrender();

               new Notification(res);
            }
         });
      },

      getDetails: function() {
         // TODO
         // fetch details
         // from youtube
         $('.edit-container', this.el).slideDown(1000);
      }
   }),

   ExtractModal: Modal.extend({
      init: function() {
         var select = new CategorySelect();
         this.file = null;
         this.model = {
            categorySelect: select.render().html()
         };

         this.render('extract', this.model);
      },

      events: {
         'change .input-file': 'loadFile',
         'click .link-type img': 'toggleSelect'
      },

      loadFile: function() {
         this.file = $('.input-file', this.el)[0].files[0];
         $('.file-name', this.el).text(this.file.name);
      },

      toggleSelect: function(e, trigger) {
         var checkBox = trigger.closest('.link-type').find('input');
         checkBox.prop('checked', !checkBox.prop('checked'));
      },

      save: function(e) {
         e.preventDefault();
         var that = this;
         var form = util.serialize(this.el);
         var category = form.category;
         var types = {};
         var selected = false;

         for (var f in form) {
            if (form[f] === 'on') {
               types[f] = true;
               selected = true;
            }
         }

         if (!selected) {
            return new Notification({
               type: 'error',
               msg: 'No link types selected.'
            });
         }

         if (!category) {
            return new Notification({
               type: 'error',
               msg: 'Links must be extracted to a collection.'
            });
         }

         if (!this.file) {
            return new Notification({
               type: 'error',
               msg: 'No file selected.'
            });
         }

         if (this.file.size > 1024 * 1024 * 3) {
            return new Notification({
               type: 'error',
               msg: 'The selected file is too large.'
            });
         }

         $(this.el).find('.submit').val('Extracting...');

         model.list.extract(this.file, types, category, function(err, report) {
            if (err) {
               $(that.el).find('.submit').val('Extract');
               new Notification(err);
            } else {
               that.unrender();
               new Notification(report);
            }
         });
      }
   }),

   LinkMenu: ClickMenu.extend({
      init: function(e, link) {
         var x = e.clientX;
         var y = e.clientY;
         var menuHeight = 120;
         var menuWidth = 180;
         var selected = $('.wrapped-link.selected');
         var active = model.list.get('activeList');
         var removal = (active.type === 'category') ? 'Delete' : 'Remove';

         var options = {
            play: 'Play',
            details: 'Details',
            playlist: 'Add to playlist',
            'delete': removal
         };

         if (selected.length > 1) {
            options.playlist = 'Add all to playlist';
            options['delete'] = removal + ' all';
         }

         if ((x + menuWidth) > $(window).width()) {
            x -= menuWidth;
         }

         if ((y + menuHeight) > $(window).height()) {
            y -= menuHeight;
         }

         this.model = {
            link: util.buildLink(link),
            menuHeight: menuHeight,
            menuWidth: menuWidth,
            shifted: false,
            position: {
               x: x,
               y: y
            },
            options: options,
            selected: selected,
            playlists: model.user.get('playlists'),
            removal: removal.toLowerCase(),
            active: active
         };
         
         this.el.empty();
         this.render();
      },

      events: {
         'click .play': 'play',
         'click .delete': 'deleteLinks',
         'click .remove': 'removeLinks',
         'click .details': 'details',
         'click .add-to': 'shiftMenu',
         'click .back-to': 'shiftMenu',
         'click .playlist': 'playlist'
      },

      render: function() {
         var template = $('#menu-template').html();
         var rendered = Mustache.render(template, this.model);

         this.el.html(rendered);
         this.el.css('height', this.model.menuHeight);
         this.el.css('left', this.model.position.x);
         this.el.css('top', this.model.position.y);

         $('body').append(this.el);

         if (this.model.playlists.length > 5) {
            $('.playlist-options', this.el).customScroll();
         }
      },

      play: function() {
         model.player.play(this.model.link);
      },

      details: function() {
         new DetailsModal(this.model.link);
      },

      deleteLinks: function() {
         var selected = this.model.selected;
         var plural = (selected.length > 1) ? 's' : '';
         var active = model.list.get('activeList');
         var links = [];

         selected.each(function() {
            links.push($(this).find('._id').text());
         });

         var confirmDelete = new ConfirmModal({
            msg: 'Confirm deletion of <strong>' + links.length + '</strong> link' + plural + '.',
            processing: 'Deleting...',
            action: function() {
               model.list.deleteLinks(active.id, links, function(err) {
                  confirmDelete.unrender();
                  if (err) {
                     new Notification(err);
                  } else {
                     var deleted = links.length;
                     active.length -= deleted;

                     selected.fadeOut(1000, function() {
                        selected.remove();
                        if (active.length < 1 && --deleted === 0) {
                           $('#empty-list').show();
                        }
                     });
                  }
               });
            }
         });
      },

      removeLinks: function() {
         var selected = this.model.selected;
         var playlist = this.model.active.id;
         var positions = [];
         var active = model.list.get('activeList');

         selected.each(function() {
            positions.push(parseInt($(this).find('.order').text()));
         });

         model.list.removeFromPlaylist(playlist, positions, function(err) {
            if (err) {
               new Notification(err);
            } else {
               var removed = selected.length;
               active.length -= removed;
               selected.fadeOut(1000, function() {
                  selected.remove();
                  if (--removed === 0) {
                     if (active.length < 1) {
                        return $('#empty-list').show();
                     }
                     model.list.updateOrder();
                  }
               });
            }
         });
      },

      shiftMenu: function(e) {
         e.stopPropagation();
         if (this.shifted) {
            this.el.css('height', this.model.menuHeight);
            this.el.find('.menu-body').animate({left: 0}, 200);
         } else {
            this.el.css('height', 180);
            this.el.find('.menu-body').animate({left: -180}, 200);
         }

         this.shifted = !this.shifted;
      },

      playlist: function(e, trigger) {
         var id = trigger.find('.id').val();
         var links = [];

         this.model.selected.each(function() {
            var linkId = $(this).find('._id').text();
            links.push(linkId);
         });

         model.list.addToPlaylist(id, links, function(err, report) {
            if (err) {
               new Notification(err);
            } else {
               new Notification(report);
            }
         });
      }
   }),

   SettingsModal: Modal.extend({
      init: function() {
         var settings = model.user.get('settings');
         var suggestions = settings.suggestions;

         this.model = {
            display: model.user.get('display'),
            email: model.user.get('email'),
            type: model.user.get('type'),
            checkSuggest: (suggestions !== '') ? 'checked' : '',
            source: suggestions,
            passLock: true
         };

         this.render('settings', this.model);
      },

      events: {
         'click #unlock-password': 'editPassword'
      },

      save: function(e) {
         e.preventDefault();
         if (model.user.get('type') === 'guest') {
            return new Notification({
               type: 'error',
               msg: 'Guest accounts are unable to perform that action.'
            });
         }

         var that = this;
         var form = util.serialize(this.el);
         if (form.display.length > 14) {
            return new Notification({
               type: 'error',
               msg: 'Display must be less then 15 characters.'
            });
         }

         var edit = {
            display: form.display,
            email: form.email,
            settings: {
               suggestions: form.suggestions,
               theme: form.theme,
               sideBar: form.sideBar
            }
         };

         if (!this.model.passLock) {
            if (!form.password || form.password !== form.passConfirm) {
               return new Notification({
                  type: 'error',
                  msg: 'Passwords are required and must match.'
               });
            }

            edit.editPass = {
               password: form.password,
               passConfirm: form.passConfirm,
               currPassword: form.currPassword
            };
         }

         if (form.showSuggestions !== 'on') {
            edit.settings.suggestions = '';
            $('#suggestion-feed').html('<img class="feed-logo" src="/img/feedLogo.png">');
         }

         model.user.editUser(edit, function(err, res) {
            if (err) {
               new Notification(err);
            } else {
               var updated = res.data;
               model.user.set('display', updated.display);
               model.user.set('email', updated.email);
               model.user.set('settings', updated.settings);

               // render display
               $('.display', '#user-controls').text(updated.display);
               that.unrender();

               if (updated.newEmail) {
                  new Notification(res);
               }
            }
         });
      },

      editPassword: function(e, trigger) {
         if (this.model.type !== 'local' || model.ui.cooldown()) {
            return false;
         }

         if (this.model.passLock) {
            $('.new-password', this.el).prop('disabled', false).val('');
            $('.edit-container', this.el).slideDown(400);
            trigger.attr('class', 'unlocked');
         } else {
            $('.new-password', this.el).prop('disabled', true).val('.......');
            $('.edit-container', this.el).slideUp(400);
            trigger.attr('class', 'locked');
         }

         this.model.passLock = !this.model.passLock;
      }
   }),

   AboutModal: Modal.extend({
      init: function() {
         this.render('about', {});
      }
   }),

   NewList: View.extend({
      el: $('<div class="new-list">'),

      init: function(type) {
         this.type = type;
         this.newList = '';
         this.valid = false;
         this.collective = (type === 'category') ? 'categories' : 'playlists';
         this.mount = '#' + this.type + '-titles';
         this.el.empty();
         this.render();
         this.check();
      },

      events: {
         'click .cancel-new': 'unrender',
         'click .save-new': 'save',
         'keyup .new-title': 'check',
         'click form': 'protect',
         'submit form': 'save'
      },

      protect: function(e) {
         if (model.ui.get('minBar')) {
            e.stopPropagation();
         }
      },

      render: function() {
         $('.new-list', '#side-bar').remove();
         $('#' + this.type + '-manager').show();

         var input = $('<input type="text" class="new-title" spellcheck="false">');
         var form = $('<form>')
                   .append(input)
                   .append('<img class="save-new" src="/img/finishRename.png">')
                   .append('<img class="cancel-new" src="/img/cancelRename.png">');

         this.el.empty().append(form);
         $(this.mount).append(this.el);
         this.el.hide().fadeIn(200);
         input.focus();

         if (model.ui.get('minBar')) {
            model.ui.set('menuProtect', true);
         }
      },

      unrender: function() {
         $(this.el).remove();
      },

      close: function() {
         this.unrender();
      },

      check: function() {
         var save = $(this.el).find('.save-new');
         this.newList = $(this.el).find('.new-title').val().trim();

         if (!this.newList) {
            save.addClass('disabled');
         } else {
            save.removeClass('disabled');
         }
      },

      save: function(e) {
         e.preventDefault();

         if (this.newList) {
            var lists = model.user.get(this.collective);
            var that = this;

            var newList = {
               name: that.newList,
               order: lists.length
            };

            model.list.addList(this.type, newList, function(err, id) {
               if (err) {
                  new Notification(err);
               } else {
                  lists.push({
                     name: newList.name,
                     order: newList.order,
                     id: id
                  });

                  model.user.set(that.collective, lists);
                  that.unrender();
               }
            });
         } else {
            new Notification({
               type: 'error',
               msg: 'Title must not be empty.'
            });
         }
      }
   }),

   ConfirmModal: ConfirmModal,
   Notification: Notification
};

},{"../model":"/home/tully/www/linkwrapper.com/public/js/player/model/index.js","../util":"/home/tully/www/linkwrapper.com/public/js/player/util/index.js","./view":"/home/tully/www/linkwrapper.com/public/js/player/views/view.js"}],"/home/tully/www/linkwrapper.com/public/js/player/views/static.js":[function(require,module,exports){
'use strict';

var View = require('./view');
var model = require('../model');
var dynamic = require('./dynamic');
var util = require('../util');

var UI = View.extend({
   el: 'html',

   init: function() {
      this.sideBar = new SideBar();
      this.player = new Player();
      this.list = new List();
   },

   events: {
      'click body': 'clearUI'
   },

   clearUI: function() {
      $('.static-menu').hide();
      $('.dynamic-menu').remove();
      $('.wrapped-link').removeClass('selected');

      if (model.ui.get('minBar') && !model.ui.get('menuProtect')) {
         $('.list-menu').hide();
      }

      model.ui.set('menuProtect', false);
   },

   Notification: dynamic.Notification
});

module.exports = UI;

var SideBar = View.extend({
   el: '#side-bar',

   init: function() {
      this.mainMenu = new MainMenu();
      this.tools = new Tools();
      this.categories = new ListManager('category');
      this.playlists = new ListManager('playlist');
      this.minBar = false;
      this.render();
   },

   events: {
      'resize window': 'render',
      'click #collapse-bar': 'collapse',
      'click #expand-bar': 'expand',
      'click #main-button': 'toggleMainMenu',
      'click #collapsed-library': 'toggleCategories',
      'click #collapsed-playlists': 'togglePlaylists'
   },

   render: function() {
      var width = $(window).width();
      var page = $('body');
      var forced = model.ui.get('forceMinBar');

      $('#expand-bar').hide();

      if (width < 1000 || forced) {
         model.ui.set('minBar', true);
         page.addClass('min-bar');
         $('.list-menu').hide();
         if (forced && width > 1000) $('#expand-bar').show();
      } else {
         $('.list-menu').show();
         model.ui.set('minBar', false);
         page.removeClass('min-bar');
      }

      if (model.user.get('categories').length) {
         this.categories.render();
      }

      if (model.user.get('playlists').length) {
         this.playlists.render();
      }
   },

   expand: function() {
      model.ui.set('forceMinBar', false);
   },

   collapse: function() {
      model.ui.set('forceMinBar', true);
   },

   toggleMainMenu: function() {
      if (model.ui.cooldown()) {
         return false;
      }

      this.mainMenu.render();
   },

   toggleCategories: function(e) {
      e.stopPropagation();
      var manager = $('#category-manager');
      var visible = manager.is(':visible');
      UI.prototype.clearUI();
      if (visible) {
         manager.hide();
      } else {
         manager.show();
      }
   },

   togglePlaylists: function(e) {
      e.stopPropagation();
      var manager = $('#playlist-manager');
      var visible = manager.is(':visible');
      UI.prototype.clearUI();
      if (visible) {
         manager.hide();
      } else {
         manager.show();
      }
   }
});

var ListManager = View.extend({

   init: function(type) {
      this.type = type;
      this.collective = (type === 'category') ? 'categories' : 'playlists';
      this.el = '#' + type + '-manager';
      this.mount = '#' + this.type + '-container';
      this.model = {
         editing: false,
         deletions: []
      };
   },

   events: {
      'click .list-title': 'loadList',
      'click .edit-lists': 'edit',
      'click .save': 'save',
      'click .cancel': 'cancel',
      'click .rename': 'rename',
      'click .remove': 'remove',
      'click .finish-rename': 'finishRename',
      'click .cancel-rename': 'finishRename',
      'submit .rename-form': 'finishRename'
   },

   render: function() {
      var titles = model.user.get(this.collective);
      var titleList = $('<ul>').attr('id', this.type + '-titles');
      var active = model.list.get('activeList');
      var height = titles.length * 25;

      titles.sort(function(a, b) {
         return a.order - b.order;
      });

      $('.save', this.mount).remove();
      $('.cancel', this.mount).remove();

      titles.forEach(function(t) {
         var list = $('<li class="list-title">');
         var wrap = $('<div class="title-wrap">').text(t.name);
         var id = $('<input type="hidden" class="id item-data">').val(t.id);

         if (this.type === active.type &&
             t.id === active.id &&
             !this.model.editing) {

            list.addClass('selected');
         }

         list.append(wrap)
             .append(id);

         if (this.model.editing) {
            list.append($('<div class="previously item-data">').text(t.name));
         }

         titleList.append(list);
      }, this);


      $(this.mount).empty().append(titleList);

      if (this.model.editing) {
         height += 40;
         titleList.addClass('editing');
         $('.list-title', this.mount).append('<div class="grab-list">')
                                     .append('<div class="rename">')
                                     .append('<div class="remove">');

         var actions = $('<div class="actions">')
                 .append('<div class="save form-button">Save</div>')
                 .append('<div class="cancel">')
                 .appendTo(titleList);

         this.sortable = new Sortable(titleList[0], {
            ghostClass: 'drag-ghost',
            animation: 150,
            handle: '.grab-list'
         });
      }

      // manage scroll
      if (model.ui.get('minBar')) {
         titleList.height(Math.min(height, 300));
         titleList.customScroll({
            contentHeight: height
         });
      } else {
         if (this.type === 'category' && height > 175) {

         titleList.customScroll({
            contentHeight: height
         });
         } else if (this.type === 'playlist') {
            var viewHeight = $('#side-bar').height() - 365;
            if (height > viewHeight) {
               titleList.height(viewHeight);

               titleList.customScroll({
                  contentHeight: height
               });
            }
         }
      }
   },

   loadList: function(e, trigger) {
      model.ui.set('menuProtect', true);

      var active = model.list.get('activeList');
      var type = this.type;
      var name = trigger.find('.title-wrap').text();
      var id = trigger.find('.id').val();

      if (this.model.editing || active.id === id) {
         return false;
      }

      $('li').removeClass('selected');
      trigger.addClass('selected');

      // assert valid mongo id
      if (!util.mongoId(id)) {
         new dynamic.Notification({
            type: 'error',
            msg: 'Unable to load the requested list'
         });

         return false;
      }

      if (active.type === 'playlist' && model.list.get('staged')) {
         model.list.syncPlaylist(function(err, report) {
            if (err) {
               return new dynamic.Notification(err);
            }
         });
      }

      model.list.set('activeList', {
         type: type,
         name: name,
         id: id,
         loaded: false,
         obj: trigger,
         length: 0
      });
   },

   edit: function(e, trigger) {
      model.ui.set('menuProtect', true);
      if (!this.model.editing) {
         this.model = {
            editing: true,
            deletions: []
         };
      } else {
         this.model.editing = false;
      }
      
      this.render();
   },

   rename: function(e, trigger) {
      e.stopPropagation();

      var list = trigger.closest('.list-title');
      var title = list.find('.title-wrap');
      var remove = list.find('.remove');
      var buffer = $('<div class="buffer item-data">').text(title.text());
      var box = $('<input class="rename-box" type="text">').val(title.text());
      var form = $('<form class="rename-form">').append(box);

      title.empty().append(form)
                   .append(buffer);
      remove.attr('class', 'cancel-rename');
      trigger.attr('class', 'finish-rename');
   },

   finishRename: function(e, trigger) {
      e.preventDefault();
      e.stopPropagation();

      var list = trigger.closest('.list-title');
      var title = list.find('.title-wrap');
      var cancelRename = list.find('.cancel-rename');
      var finishRename = list.find('.finish-rename');
      var newTitle = title.find('.rename-box').val().trim();
      var buffered = title.find('.buffer').text();
      var action = trigger.attr('class');

      if (!newTitle && action !== 'cancel-rename') {
         new dynamic.Notification({
            type: 'error',
            msg: 'List name cannot be empty.'
         });

         return false;
      }

      title.empty();

      if (action === 'cancel-rename') {
         title.text(buffered);
      } else {
         title.text(newTitle);
      }

      finishRename.attr('class', 'rename');
      cancelRename.attr('class', 'remove');
   },

   remove: function(e, trigger) {
      e.stopPropagation();
      var deletion = trigger.closest('.list-title');
      this.model.deletions.push({
         name: deletion.find('.title-wrap').text(),
         id: deletion.find('.id').val(),
         previously: deletion.find('.previously').text()
      });

      deletion.remove();
   },

   cancel: function(e, trigger) {
      this.model = {
         editing: false,
         deletions: []
      };

      this.render();
   },

   save: function() {
      model.ui.set('menuProtect', true);
      var deletions = this.model.deletions;
      var newList = [];
      var that = this;

      $('.list-title', this.el).each(function(i) {
         var name = $(this).find('.title-wrap').text();
         var id = $(this).find('.id').val();

         newList.push({
            name: name,
            id: id,
            order: i
         });
      });

      var editLists = function(edit) {
         var stillActive = false;
         var active = model.list.get('activeList');

         edit.forEach(function(list) {
            if (list.id === active.id) {
               active.name = list.name;
               stillActive = true;
            }
         });

         if (edit.length) {
            model.list.editLists(that.type, edit, function(err, report) {
               if (err) {
                  new dynamic.Notification(err);
               }
            });
         }

         if (active.type === that.type && !stillActive) {
            model.list.set('activeList', {});
         }

         that.model = {
            editing: false,
            deletions: []
         };
      }

      if (deletions.length) {
         deletions.forEach(function(d) {
            if (d.name !== d.previously) {
               d.clarify = '(Previously: ' + d.previously + ')';
            }
         });

         var confirmDelete = new dynamic.ConfirmModal({
            msg: Mustache.render($('#delete-template').html(), {deletions: deletions}),
            processing: 'Deleting...',
            action: function() {
               var del = [];

               deletions.forEach(function(list) {
                  del.push(list.id);
               });

               model.list.deleteLists(that.type, del, function(err) {
                  if (err) {
                     new dynamic.Notification(err);
                  }
               });

               editLists(newList);
               model.user.set(that.collective, newList);
               confirmDelete.unrender();
            }
         });
      } else {
         editLists(newList);
         model.user.set(this.collective, newList);
      }
   }
});

var Player = View.extend({
   el: '#player-view',

   init: function() {
      this.resizeButtons = new ResizeButtons();
      this.playing = new NowPlaying();
      this.suggestions = new Suggestions();
   },

   render: function() {
      var height = model.player.get('height');
      var currHeight = $(this.el).height();
      var activePlayer = model.player.get('active');

      // never call hide on an active player
      $('iframe', this.el).each(function() {
         var id = $(this).attr('id');
         if (id === activePlayer) {
            $(this).show();
         } else {
            $(this).hide();
         }
      });

      if (height > 0) {
         $(this.el).css('margin-top', 0);
         $(this.el).height(model.player.get('height'));
      } else {
         $(this.el).css('margin-top', currHeight * -1);
      }

      $('#link-list').css('top', height + 40);
   }
});

var Suggestions = View.extend({
   el: '#suggestion-feed',

   events: {
      'click .suggestion': 'play'
   },

   render: function() {
      $(this.el).empty();
      var settings = model.user.get('settings');
      if (settings.suggestions) {
         var related = model.player.get('related');
         for (var key in related) {
            var template = $('#suggestion-template').html();
            var rendered = Mustache.render(template, related[key]);
            $(this.el).append(rendered);
         }
      } else {
         $(this.el).html('<img class="feed-logo" src="/img/feedLogo.png">');
      }
   },

   play: function(e, trigger) {
      var id = trigger.find('.id').val();
      var related = model.player.get('related');
      var link = related[id];
      link.type = 'suggestion';
      model.player.play(link);
   }
});

var NowPlaying = View.extend({
   el: '#now-playing',
   addButton: $('#add-playing'),

   init: function() {
      this.addButton.hide();
      this.addButton.css('opacity', 1);
   },

   events: {
      'click #add-playing': 'addPlaying'
   },

   render: function() {
      var link = model.player.get('playing');
      $('.details', this.el).text(link.title + ' - ' + link.artist);
      $('.play').removeClass('playing');

      if (link.type === 'suggestion') {
         this.addButton.fadeIn(400);
      } else {
         this.addButton.fadeOut(400);
      }

      if (link.type === 'main') {
         link.obj.find('.play').addClass('playing');
         link.obj.find('.play-count').text(link.playCount + 1);
         model.list.mutated({
            threshold: 10
         });
      }
   },

   addPlaying: function(e, trigger) {
      var playing = model.player.get('playing');
      new dynamic.AddLinkModal(playing);
   }
});

var MainMenu = View.extend({
   el: '#main-menu',

   init: function() {
      var menu = $(this.el);
      setTimeout(function() {
         menu.slideUp(1000);
      }, 1000);

      this.visible = false;
   },

   events: {
      'click .settings': 'settings',
      'click .about': 'about',
      'click .logout': 'logout'
   },

   render: function() {
      if (this.visible) {
         $(this.el).slideUp(200);
      } else {
         $(this.el).slideDown(200);
      }

      this.visible = !this.visible;
   },

   settings: function() {
      new dynamic.SettingsModal();
   },

   about: function() {
      new dynamic.AboutModal();
   },

   logout: function() {
      if (model.list.get('staged')) {
         model.list.syncPlaylist();
      }
   }
});

var ResizeButtons = View.extend({
   el: '#resize-buttons',

   events: {
      'click .resize-player': 'resizePlayer',
   },

   resizePlayer: function(e, trigger) {
      e.stopPropagation();

      if (model.ui.cooldown()) {
         return false;
      }

      var size = trigger.attr('id');
      var sizeMap = {
         'no-view': 0,
         'normal-view': 300,
         'large-view': 500
      };

      model.player.set('height', sizeMap[size]);
   }
});

var List = View.extend({
   el: '#link-list',
   cover: $('<div id="list-cover">'),
   loading: '#loading-list',
   playTitle: '#play-title',

   init: function() {
      this.search = new Search();
      this.emptyList = $('#empty-list', this.el);
      this.listBody = $('#list-body', this.el);
      $(this.el).append(this.cover);
      this.columns();
   },

   events: {
      'resize window': 'columns',
      'click #list-head .sortable': 'sort',
      'click .wrapped-link': 'select',
      'dblclick .wrapped-link': 'play',
      'click .play': 'play',
      'contextmenu .wrapped-link': 'linkMenu',
      'click .add-many': 'extract',
      'click .add-one': 'newLink'
   },

   render: function(links) {
      var sort = model.list.get('sort');
      var active = model.list.get('activeList');

      if (active.type === 'playlist') {
         $(this.playTitle).text('Order');
         $('.col-head').removeClass('sortable');
      } else {
         $('.col-head').addClass('sortable');
         $(this.playTitle).text('Plays');
      }

      if (!active.loaded) {
         this.cover.show();
         $(this.loading).show();
         return;
      } else {
         this.cover.hide();
         $(this.loading).hide();
      }

      if (links) {
         this.emptyList.hide();

         if (links.length) {
            var html = Mustache.render($('#' + active.type + '-template').html(), {
               links: links
            });
            this.listBody.html(html);
         } else {
            this.emptyList.show();
         }
      }

      var arrows = $('.sort-arrow', this.el)
                   .hide()
                   .removeClass('ascending descending');

      if (sort.sorted) {
         if (sort.descending) {
            arrows.addClass('descending');
         } else {
            arrows.addClass('ascending');
         }

         $('.sort-arrow', sort.column).show();
      }
   },

   columns: function() {
      var width = $(window).width();

      if (width < 700) {
         $('html').addClass('min-list');
      } else {
         $('html').removeClass('min-list');
      }
   },

   play: function(e, trigger) {
      var link = trigger.closest('.wrapped-link');
      model.player.play(link);
   },

   select: function(e, trigger) {
      e.stopPropagation();

      if (e.shiftKey) {
         var selected = $('.wrapped-link.selected').get(0);
         var aboveList = [];
         var belowList = [];
         var above = trigger.prev();
         var below = trigger.next();
         trigger.addClass('selected');

         if (selected && selected !== trigger.get(0)) {
            while (above.length || below.length) {
               if (above.length && above.is(':visible')) aboveList.push(above);
               if (below.length && below.is(':visible')) belowList.push(below);

               if (above.get(0) === selected) {
                  belowList.length = 0;
                  break;
               }

               if (below.get(0) === selected) {
                  aboveList.length = 0;
                  break;
               }

               above = above && above.prev();
               below = below && below.next();
            }

            aboveList.concat(belowList).forEach(function(li) {
               li.addClass('selected');
            });
         }
      } else {
         if (!e.ctrlKey) {
            UI.prototype.clearUI();
         }

         if (trigger.hasClass('selected')) {
            trigger.removeClass('selected');
         } else {
            trigger.addClass('selected');
         }
      }
   },

   sort: function(e, trigger) {
      var sort = model.list.get('sort');

      model.list.set('sort', {
         sorted: true,
         descending: !sort.descending,
         column: trigger
      });

      model.list.sort({
         cell: trigger.data('col'),
         numeric: trigger.data('numeric')
      });
   },

   linkMenu: function(e, trigger) {
      e.preventDefault();
      if (!trigger.hasClass('selected')) {
         UI.prototype.clearUI();
      }
      trigger.addClass('selected');
      new dynamic.LinkMenu(e, trigger);
   },

   extract: function() {
         if (!window.FileReader) {
             return new dynamic.Notification({
               type: 'error',
               msg: 'Your browser does not support this feature.'
            });
         }

      new dynamic.ExtractModal();
   },

   newLink: function() {
      new dynamic.AddLinkModal();
   },

   reorder: function() {
   
   }
});

var Search = View.extend({
   el: '#search-view',

   events: {
      'focus input': 'expand',
      'blur input': 'collapse',
      'keyup input': 'search',
      'click .search-icon': 'searchType'
   },

   expand: function() {
      $(this.el).css('width', '25%');
   }, 

   collapse: function() {
      $(this.el).css('width', '20%');
   },

   search: (function() { // avoid typing lag
      var delay = 0;

      return function() {
         var term = $('input', this.el).val();
         clearTimeout(delay);
         delay = setTimeout(function() {
            var type = model.list.get('search');

            if (type === 'local') {
               model.list.search({
                  term: term,
                  cells: [1,2,3,4]
               });
            } else {
               model.player.search(type, term, function(items) {
                  // TODO
                  // display results
               });
            }
         }, 400);
      }
   }()),

   searchType: function(e) {
      // TODO
      // search type menu
   }
});


var Tools = View.extend({
   el: '#player-tools',

   init: function() {
      this.addMenu = new AddMenu();
      this.addVisible = false;
   },

   events: {
      'click #add-button': 'toggleAddMenu',
      'click #shuffle': 'toggleShuffle',
      'click #repeat': 'toggleRepeat'
   },

   toggleAddMenu: function(e) {
      e.stopPropagation();
      var add = $('#add-menu', this.el);
      var visible = add.is(':visible');
      UI.prototype.clearUI();

      if (visible) {
         this.addMenu.unrender();
      } else {
         this.addMenu.render();
      }
   },

   toggleShuffle: function() {
      var shuffle = $('#shuffle', this.el);
      var active = model.player.get('shuffle');

      if (active) {
         shuffle.attr('src', '/img/shuffle.png');
         model.player.set('shuffle', false);
      } else {
         shuffle.attr('src', '/img/shuffleActive.png');
         model.player.set('shuffle', true);
      }
   },

   toggleRepeat: function() {
      var repeat = $('#repeat', this.el);
      var active = model.player.get('repeat');

      if (active) {
         repeat.attr('src', '/img/repeat.png');
         model.player.set('repeat', false);
      } else {
         repeat.attr('src', '/img/repeatActive.png');
         model.player.set('repeat', true);
      }
   }
});

var AddMenu = View.extend({
   el: '#add-menu',

   events: {
      'click .link': 'addLink',
      'click .extract': 'extract',
      'click .category': 'category',
      'click .playlist': 'playlist'
   },

   render: function() {
      $(this.el).show();
   },

   unrender: function() {
      $(this.el).hide();
   },

   addLink: function() {
      new dynamic.AddLinkModal();
   },

   extract: function() {
      new dynamic.ExtractModal();
   },

   category: function() {
      if (!$('.save', '#category-manager').length) {
         new dynamic.NewList('category');
      } else {
         new dynamic.Notification({
            type: 'error',
            msg: 'You must finish editing <strong>LIBRARY</strong> to perform that action.'
         });
      }
   },

   playlist: function() {
      if (!$('.save', '#playlist-manager').length) {
         new dynamic.NewList('playlist');
      } else {
         new dynamic.Notification({
            type: 'error',
            msg: 'You must finish editing <strong>PLAYLISTS</strong> to perform that action.'
         });
      }
   }
});

},{"../model":"/home/tully/www/linkwrapper.com/public/js/player/model/index.js","../util":"/home/tully/www/linkwrapper.com/public/js/player/util/index.js","./dynamic":"/home/tully/www/linkwrapper.com/public/js/player/views/dynamic.js","./view":"/home/tully/www/linkwrapper.com/public/js/player/views/view.js"}],"/home/tully/www/linkwrapper.com/public/js/player/views/view.js":[function(require,module,exports){
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
      if (m === 'events') {
         Child.prototype.events = Child.prototype.events || {};
         for (var e in members.events) {
            Child.prototype.events[e] = members.events[e];
         }
      } else {
         Child.prototype[m] = members[m];
      }
   }

   Child.extend = extend;

   return Child;
}

},{}]},{},["/home/tully/www/linkwrapper.com/public/js/player/index.js"]);
