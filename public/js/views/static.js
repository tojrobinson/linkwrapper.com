'use strict';

var View = require('./view');
var dynamic = require('./dynamic');
var util = require('../util');
var player = require('../model/player');
var library = require('../model/library');
var user = require('../model/user');

// main view
module.exports = View.extend({
   el: 'html',

   init: function() {
      this.sideBar = new SideBar();
      this.player = new Player();
      this.list = new List();

      // wtf fb
      if (window.location.hash.match(/#.*/)) {
         window.location.hash = '';
         history.pushState('', document.title, window.location.pathname);
      }

      this.render();
   },

   events: {
      'click body': 'clearState',
      'resize window': 'render'
   },

   clearState: function() {
      util.clearState();
   },

   render: function() {
      var width = $(window).width();

      $('#expand-bar').hide();

      if (width < 1000) {
         if (width < 700) {
            $(this.el).addClass('min-list');
         } else {
            $(this.el).removeClass('min-list');
         }

         $(this.el).addClass('collapse');
      } else if (library.get('minBar')) {
         $(this.el).addClass('collapse');
         $('#expand-bar').show();
      } else {
         $(this.el).removeClass('collapse')
                   .removeClass('min-list');
      }
   }
});

var SideBar = View.extend({
   el: '#side-bar',

   init: function() {
      this.mainMenu = new MainMenu();
      this.tools = new Tools();
      this.categories = new ListManager('category');
      this.playlists = new ListManager('playlist');
   },

   events: {
      'click #collapse-bar': 'collapse',
      'click #expand-bar': 'expand',
      'click #main-button': 'toggleMainMenu'
   },

   expand: function() {
      library.set('minBar', false);
   },

   collapse: function() {
      library.set('minBar', true);
   },

   toggleMainMenu: function() {
      if (util.cooldown()) {
         return false;
      }

      this.mainMenu.render();
   }
});

var ListManager = View.extend({
   init: function(type) {
      this.type = type;
      this.collective = (type === 'category') ? 'categories' : 'playlists';
      this.el = '#' + type + '-manager';
      this.model = {
         editing: false,
         deletions: []
      };
   },

   events: {
      'click .list-title': 'renderList',
      'click .edit-lists': 'edit',
      'click .save': 'save',
      'click .cancel': 'cancel',
      'click .rename': 'rename',
      'click .remove': 'remove',
      'click .finish-rename': 'finishRename',
      'click .cancel-rename': 'finishRename'
   },

   render: function() {
      var titles = user.get(this.collective);
      var container = $('ul', this.el);
      var active = library.get('activeList');

      titles.sort(function(a, b) {
         return a.order - b.order;
      });

      $('.save', this.el).remove();
      $('.cancel', this.el).remove();
      container.empty();

      titles.forEach(function(t) {
         var list = $('<li class="list-title">');
         var wrap = $('<div class="title-wrap">').text(t.name);

         if (t.name.toLowerCase() === active.name) {
            list.addClass('selected');
         }

         if (this.model.editing) {
            var previously = $('<div class="previously item-data">').text(t.name);
         }

         list.append(wrap)
             .append(previously);

         container.append(list);
      }, this);

      if (this.model.editing) {
         $('.title-wrap', this.el).css('width', '70%');
         $('.list-title', this.el).append('<div class="rename">')
                                  .append('<div class="remove">');

         var actions = $('<div class="actions">');
         actions.append('<div class="save form-button">Save</div>')
                .append('<div class="cancel">');
         container.append(actions);
      }
   },

   renderList: function(e, trigger) {
      var name = trigger.find('.title-wrap')
                        .text()
                        .toLowerCase();
      var type = this.type;

      if (this.model.editing) {
         return false;
      }

      $('li').removeClass('selected');
      trigger.addClass('selected');

      library.set('activeList', {
         type: type,
         name: name,
         obj: trigger
      });
   },

   edit: function(e, trigger) {
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

      title.empty().append(box)
                   .append(buffer);
      remove.attr('class', 'cancel-rename');
      trigger.attr('class', 'finish-rename');
   },

   finishRename: function(e, trigger) {
      e.stopPropagation();

      var list = trigger.closest('.list-title');
      var title = list.find('.title-wrap');
      var cancelRename = list.find('.cancel-rename');
      var finishRename = list.find('.finish-rename');
      var box = title.find('.rename-box');
      var buffered = title.find('.buffer').text();

      title.empty();

      if (trigger.attr('class') === 'cancel-rename') {
         title.text(buffered);
      } else {
         title.text(box.val());
      }

      finishRename.attr('class', 'rename');
      cancelRename.attr('class', 'remove');
   },

   remove: function(e, trigger) {
      e.stopPropagation();
      var deletion = trigger.closest('.list-title');
      this.model.deletions.push({
         name: deletion.find('.title-wrap').text(),
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
      var deletions = this.model.deletions;
      var newList = [];
      var rename = [];

      $('.list-title', this.el).each(function(i) {
         var name = $(this).find('.title-wrap').text();
         var previously = $(this).find('.previously').text();

         newList.push({
            name: name,
            order: i
         });

         if (name !== previously) {
            rename.push({
               from: previously.toLowerCase(),
               to: name.toLowerCase()
            });
         }
      });

      if (rename.length) {
         library.renameLists(this.type, rename);
      }

      this.model = {
         editing: false,
         deletions: []
      };

      if (deletions.length) {
         var that = this;
      
         deletions.forEach(function(item) {
            if (item.name !== item.previously) {
               item.clarify = '(previously: ' + item.previously + ')';
            }
         });

         var model = {
            deletions: deletions
         };

         var confirmSave = new dynamic.ConfirmModal({
            message: Mustache.render($('#delete-template').html(), model),

            action: function() {
               var del = [];

               deletions.forEach(function(list) {
                  del.push(list.name.toLowerCase());
               });

               library.deleteLists(that.type, del);
               user.set(that.collective, newList);
               confirmSave.unrender();
            },

            cleanUp: function() {
               that.render();
            }
         });
      } else {
         user.set(this.collective, newList);
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
      var height = player.get('height');
      var currHeight = $(this.el).height();
      var activePlayer = player.get('active');

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
         $(this.el).height(player.get('height'));
      } else {
         $(this.el).css('margin-top', currHeight * -1);
      }
   }
});

var Suggestions = View.extend({
   el: '#suggestion-feed',

   events: {
      'click .suggestion': 'play'
   },

   render: function() {
      $(this.el).empty();
      player.get('related').forEach(function(item) {
         var template = $('#suggestion-template').html();
         var rendered = Mustache.render(template, item);
         $(this.el).append(rendered);
      }, this);
      player.set('related', []);
   },

   play: function(e, trigger) {

   }
});

var NowPlaying = View.extend({
   el: '#now-playing',

   render: function() {
      var link = player.get('playing');
      $(this.el).text(link.title + ' - ' + link.artist);
      $('.play').removeClass('playing');
      link.obj.find('.play').addClass('playing');
   }
});

var MainMenu = View.extend({
   el: '#main-menu',

   events: {
      'click #settings': 'settings'
   },

   settings: function() {
      new dynamic.SettingsModal();
   },

   render: function() {
      var menu = $(this.el);
      if ($(this.el).is(':visible')) {
         $(this.el).animate({height: 0}, 300, function() {
            menu.hide();
         });
      } else {
         menu.css('display', 'block');
         $(this.el).animate({height: 110}, 300);
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

      if (util.cooldown()) {
         return false;
      }

      var size = trigger.attr('id');
      var sizeMap = {
         'no-view': 0,
         'normal-view': 300,
         'large-view': 500
      };

      player.set('height', sizeMap[size]);
   }
});

var List = View.extend({
   el: '#link-list',

   init: function() {
      this.search = new Search();
   },

   events: {
      'click #list-head .sortable': 'sort',
      'click .wrapped-link': 'select',
      'dblclick .wrapped-link': 'play',
      'click .play': 'play',
      'contextmenu .wrapped-link': 'linkMenu'
   },

   render: function(content) {
      var sort = library.get('sort');

      if (content) {
         if (content === 'empty'){
            // TODO
            // populate list options
         } else {
            $('#list-body', this.el).html(content);
         }
      }

      $('.sort-arrow', this.el).hide();

      if (sort.sorted) {
         if (sort.descending) {
            $('.sort-arrow', this.el).attr('src', '/img/sortDown.png');
         } else {
            $('.sort-arrow', this.el).attr('src', '/img/sortUp.png');
         }

         $('.sort-arrow', sort.column).show();
      }

      $(this.el).css('top', player.get('height') + 40);
   },

   play: function(e, trigger) {
      var link = trigger.closest('.wrapped-link');
      player.play(link);
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
               if (above.length) aboveList.push(above);
               if (below.length) belowList.push(below);

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
            util.clearState();
         }

         if (trigger.hasClass('selected')) {
            trigger.removeClass('selected');
         } else {
            trigger.addClass('selected');
         }
      }
   },

   sort: function(e, trigger) {
      var sort = library.get('sort');
      var el = $(e.target);

      library.set('sort', {
         sorted: true,
         descending: !sort.descending,
         column: trigger
      });

      library.sort({
         cell: el.data('col'),
         numeric: el.data('numeric')
      });
   },

   linkMenu: function(e, trigger) {
      e.preventDefault();
      if (!trigger.hasClass('selected')) {
         util.clearState();
      }
      trigger.addClass('selected');
      new dynamic.LinkMenu(e, trigger);
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
            var type = library.get('search');

            if (type === 'local') {
               library.search({
                  term: term,
                  cells: [1,2,3,4]
               });
            } else {
               player.search(type, term, function(items) {
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
   },

   events: {
      'click #add-button': 'toggleAddMenu',
      'click #shuffle': 'toggleShuffle',
      'click #repeat': 'toggleRepeat'
   },

   toggleAddMenu: function(e) {
      e.stopPropagation();
      var visible = $('#add-menu').is(':visible');
      util.clearState();

      if (visible) {
         this.addMenu.unrender();
      } else {
         this.addMenu.render();
      }
   },

   toggleShuffle: function() {
      var shuffle = $('#shuffle', this.el);
      var active = player.get('shuffle');

      if (active) {
         shuffle.attr('src', '/img/shuffle.png');
         player.set('shuffle', false);
      } else {
         shuffle.attr('src', '/img/shuffleActive.png');
         player.set('shuffle', true);
      }
   },

   toggleRepeat: function() {
      var repeat = $('#repeat', this.el);
      var active = player.get('repeat');

      if (active) {
         repeat.attr('src', '/img/repeat.png');
         player.set('repeat', false);
      } else {
         repeat.attr('src', '/img/repeatActive.png');
         player.set('repeat', true);
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
      }
   },

   playlist: function() {
      if (!$('.save', '#playlist-manager').length) {
         new dynamic.NewList('playlist');
      }
   }
});
