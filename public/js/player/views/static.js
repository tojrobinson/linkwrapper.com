'use strict';

var View = require('./view');
var model = require('../model');
var dynamic = require('./dynamic');
var util = require('../util');
var manager = require('../model/manager');

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

   clearUI: function(e) {
      $('.static-menu').hide();
      $('.dynamic-menu').remove();
      $('.wrapped-link').removeClass('selected');

      if (model.ui.get('minBar') && !model.ui.get('menuProtect')) {
         $('.list-menu').hide();
      }
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
      $('#player-tools').show();

      if (width < 1000 || forced) {
         model.ui.set('minBar', true);
         page.addClass('min-bar');

         if (forced && width > 1000) {
            $('#expand-bar').show();
         }
      } else {
         $('.list-menu').show();
         model.ui.set('minBar', false);
         page.removeClass('min-bar');
      }

      if (!model.ui.get('menuProtect')) {
         if (model.user.get('categories').length) {
            this.categories.render();
         }

         if (model.user.get('playlists').length) {
            this.playlists.render();
         }

         if (model.ui.get('minBar')) {
            $('.list-menu').hide();
         }
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
         if (height > 250) {
            titleList.height(250);

            titleList.customScroll({
               contentHeight: height
            });
         }
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

      util.clearSearch();
      model.list.clearSearch();

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
   cover: $('<div class="player-cover">').html('<div>Player not found.</div>'),

   init: function() {
      this.resizeButtons = new ResizeButtons();
      this.playing = new NowPlaying();
      this.suggestions = new Suggestions();
   },

   render: function() {
      var height = model.player.get('height');
      var currHeight = $(this.el).height();
      var activePlayer = model.player.get('active');
      var loading = model.player.get('loading');

      if (loading) {
         $(this.el).addClass('loading-player');
      }

      if (!activePlayer) {
         this.cover.appendTo('#player');
      } else {
         this.cover.remove();
      }

      // never call hide on an active player
      $('.player', this.el).each(function() {
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
         related.forEach(function(item) {
            var template = $('#suggestion-template').html();
            var rendered = Mustache.render(template, item);
            $(this.el).append(rendered);
         }, this);
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
      }, 1500);

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
      'click .link-menu': 'linkMenu',
      'click .add-many': 'extract',
      'click .add-one': 'newLink',
      'click .search-result': 'playResult',
      'click .add-result': 'addResult'
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

      if (active.loaded === false) {
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

   playResult: function(e, trigger) {
      var url = trigger.find('.url').val();
      var title = trigger.find('.title').val();
      var artist = trigger.find('.artist').val();

      model.player.play({
         url: url,
         title: title,
         artist: artist,
         type: 'result'
      });
   },

   addResult: function(e, trigger) {
      e.stopPropagation();

      var result = trigger.closest('.search-result');
      var url = result.find('.url').val();
      var title = result.find('.title').val();
      var artist = result.find('.artist').val();

      new dynamic.AddLinkModal({
         url: url,
         title: title,
         artist: artist
      });
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
      e.stopPropagation();

      if (!trigger.closest('.wrapped-link').hasClass('selected')) {
         UI.prototype.clearUI();
      }

      trigger.closest('.wrapped-link').addClass('selected');
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
   results: '.result-list',
   searchOptions: $('#search-options'),

   init: function() {
      this.searchOptions.hide();
      this.searchOptions.css('opacity', 1);
   },

   events: {
      'focus input': 'expand',
      'blur input': 'collapse',
      'input input': 'search',
      'click #active-search': 'typeMenu',
      'click #clear-search': 'clearSearch',
      'click .search-option': 'setSearch'
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
         var type = model.list.get('search');
         var previous = $(this.results);

         clearTimeout(delay);

         if (term.trim()) {
            $('#clear-search').show();
         } else {
            return this.clearSearch();
         }

         var cb = function(results) {
            var template = $('#results-template').html();
            var rendered = Mustache.render(template, {results: results});
            previous.remove();
            $('#link-list').append(rendered);
         }

         delay = setTimeout(function() {
            if (type === 'local') {
               model.list.search({
                  term: term,
                  cells: [1,2,3,4]
               });
            } else {
               manager.action({
                  type: 'search',
                  player: type,
                  args: [{term: term}, cb]
               });
            }
         }, 400);
      }
   }()),

   typeMenu: function(e) {
      e.stopPropagation();
      var visible = this.searchOptions.is(':visible');

      if (visible) {
         this.searchOptions.hide();
      } else {
         this.searchOptions.show();
      }
   },

   setSearch: function(e, trigger) {
      var type = trigger.data('search');
      var active = $('#active-search');

      model.list.set('search', type);

      if (type === 'youtube') {
         active.attr('src', '/img/youTubeSearch.png');
      } else if (type === 'vimeo') {
         active.attr('src', '/img/vimeoSearch.png');
      } else if (type === 'soundcloud') {
         active.attr('src', '/img/soundCloudSearch.png');
      } else {
         active.attr('src', '/img/search.png');
      }

      this.clearSearch();
   },

   clearSearch: function() {
      util.clearSearch();
      model.list.clearSearch();
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
      if (!window.FileReader) {
         return new dynamic.Notification({
            type: 'error',
            msg: 'Your browser does not support this feature.'
         });
      }

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
