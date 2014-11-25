'use strict';

var View = require('./view');
var dynamic = require('./dynamic');
var util = require('../util');
var player = require('../model/player');
var library = require('../model/library');
var user = require('../model/user');

// root view
module.exports = View.extend({
   el: 'html',

   init: function() {
      this.sideBar = new SideBar();
      this.player = new Player();
      this.list = new List();

      this.sideBar.render();
      this.list.render();
      // wtf fb
      if (window.location.hash.match(/#.*/)) {
         window.location.hash = '';
         history.pushState('', document.title, window.location.pathname);
      }
   },

   events: {
      'click body': 'clearState'
   },

   clearState: function() {
      util.clearState();
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
      'resize window': 'render',
      'click #collapse-bar': 'collapse',
      'click #expand-bar': 'expand',
      'click #main-button': 'toggleMainMenu',
      'click #collapsed-library': 'showCategories',
      'click #collapsed-playlists': 'showPlaylists'
   },

   render: function() {
      var width = $(window).width();
      var page = $('body');

      $('#expand-bar').hide();

      if (width < 1000) {
         page.addClass('collapse');
      } else if (library.get('minBar')) {
         page.addClass('collapse');
         $('#expand-bar').show();
      } else {
         page.removeClass('collapse');
      }
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
   },

   showCategories: function() {
      this.categories.render();
   },

   showPlaylists: function() {
      this.playlists.render();
   }
});

var ListManager = View.extend({
   init: function(type) {
      this.type = type;
      this.collective = (type === 'category') ? 'categories' : 'playlists';
      this.el = '#' + type + '-manager';
      this.mount = '#' + this.collective;
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
      'click .cancel-rename': 'finishRename',
      'submit .rename-form': 'finishRename'
   },

   render: function() {
      var titles = user.get(this.collective);
      var titleList = $('<ul>');
      var active = library.get('activeList');

      titles.sort(function(a, b) {
         return a.order - b.order;
      });

      $('.save', this.mount).remove();
      $('.cancel', this.mount).remove();
      $(this.mount).empty();

      titles.forEach(function(t) {
         var list = $('<li class="list-title">');
         var wrap = $('<div class="title-wrap">').text(t.name);
         var id = $('<input type="hidden" class="id item-data">').val(t.id);

         if (this.type === active.type &&
             t.id === active.id &&
             !this.model.editing) {

            list.addClass('selected');
         }

         if (this.model.editing) {
            var previously = $('<div class="previously item-data">').text(t.name);
         }

         list.append(wrap)
             .append(id)
             .append(previously);

         titleList.append(list);
      }, this);

      $(this.mount).append(titleList);

      if (this.model.editing) {
         titleList.addClass('editing');
         $('.title-wrap', this.mount).css('width', '70%');
         $('.list-title', this.mount).append('<div class="list-grab">')
                                     .append('<div class="rename">')
                                     .append('<div class="remove">');

         var actions = $('<div class="actions">');
         actions.append('<div class="save form-button">Save</div>')
                .append('<div class="cancel">');
         titleList.append(actions);

         this.sortable = new Sortable(titleList[0], {
            ghostClass: 'drag-ghost',
            handle: '.list-grab'
         });
      }

      // TODO
      // show lists from minBar
      if (library.get('minBar')) {
      } else {
      }
   },

   renderList: function(e, trigger) {
      var name = trigger.find('.title-wrap')
                        .text();
      var type = this.type;
      var id = trigger.find('.id')
                      .val();


      if (this.model.editing) {
         return false;
      }

      $('li').removeClass('selected');
      trigger.addClass('selected');

      // assert valid mongo id
      if (id.length !== 24) {
         new dynamic.Notification({
            type: 'error',
            msg: 'Unable to load the requested list'
         });

         return false;
      }

      library.set('activeList', {
         type: type,
         name: name,
         id: id,
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
         if (edit.length) {
            library.editLists(that.type, edit, function(err, report) {
               if (err) {
                  new dynamic.Notification(report);
               }
            });

            that.model = {
               editing: false,
               deletions: []
            };
         }
      }

      if (deletions.length) {
         deletions.forEach(function(d) {
            if (d.name !== d.previously) {
               d.clarify = '(Previously: ' + d.previously + ')';
            }
         });

         var confirmDelete = new dynamic.ConfirmModal({
            msg: Mustache.render($('#delete-template').html(), {deletions: deletions}),

            action: function() {
               var del = [];

               deletions.forEach(function(list) {
                  del.push(list.id);
               });

               library.deleteLists(that.type, del, function(err) {
                  if (err) {
                     new dynamic.Notification(err);
                  }
               });

               editLists(newList);
               user.set(that.collective, newList);
               confirmDelete.unrender();
            }
         });
      } else {
         editLists(newList);
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
      var settings = user.get('settings');
      if (settings.suggestions) {
         var related = player.get('related');
         Object.keys(related).forEach(function(key) {
            var template = $('#suggestion-template').html();
            var rendered = Mustache.render(template, related[key]);
            $(this.el).append(rendered);
         }, this);
      } else {
         $(this.el).html('<img class="feed-logo" src="/img/feedLogo.png">');
      }
   },

   play: function(e, trigger) {
      var id = trigger.find('.id').val();
      var related = player.get('related');
      player.play(related[id]);
   }
});

var NowPlaying = View.extend({
   el: '#now-playing',

   render: function() {
      var link = player.get('playing');
      $(this.el).text(link.title + ' - ' + link.artist);
      $('.play').removeClass('playing');

      if (link.type === 'main') {
         link.obj.find('.play').addClass('playing');
         link.obj.find('.play-count').text(link.playCount + 1);
      }
   }
});

var MainMenu = View.extend({
   el: '#main-menu',

   init: function() {
      this.visible = false;
   },

   events: {
      'click #settings': 'settings'
   },

   settings: function() {
      new dynamic.SettingsModal();
   },

   render: function() {
      if (this.visible) {
         $(this.el).animate({height: 0}, 300, function() {
            $(this.el).hide();
         });
      } else {
         $(this.el).css('display', 'block')
                   .animate({height: 110}, 300);
      }

      this.visible = !this.visible;
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
      'resize window': 'columns',
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
      this.addVisible = false;
   },

   events: {
      'click #add-button': 'toggleAddMenu',
      'click #shuffle': 'toggleShuffle',
      'click #repeat': 'toggleRepeat'
   },

   toggleAddMenu: function(e) {
      e.stopPropagation();
      util.clearState();

      if (this.addVisible) {
         this.addMenu.unrender();
      } else {
         this.addMenu.render();
      }

      this.addVisible = !this.addVisible;
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
