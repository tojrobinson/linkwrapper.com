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
   },

   events: {
      'click #collapse-bar': 'collapse',
      'click #expand-bar': 'expand',
      'click #main-button': 'toggleMainMenu',
      'click .category-title': 'renderCategory',
      'click .playlist-title': 'renderPlaylist'
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

   renderCategory: function(e, trigger) {
      var name = trigger.text().toLowerCase();
      $('li', this.el).removeClass('selected');
      trigger.addClass('selected');

      library.set('activeList', {
         type: 'category',
         name: name
      });
   },

   renderPlaylist: function(e, trigger) {
      var name = trigger.text().toLowerCase();
      $('li', this.el).removeClass('selected');
      trigger.addClass('selected');

      library.set('activeList', {
         type: 'playlist',
         name: name
      });
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
   
   },

   render: function() {
      $(this.el).empty();
      player.get('related').forEach(function(item) {
         var template = $('#suggestion-template').html();
         var rendered = Mustache.render(template, item);
         $(this.el).append(rendered);
      }, this);
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

   addLink: function(model) {
      var newLink = new Link(model);
      var active = library.get('activeList');
      if (active.type === 'category' && active.name  === model.category) {
         newLink.render();
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

var Link = View.extend({
   el: '#list-body',

   init: function(model) {
      this.model = model;
   },

   render: function() {
      var link = $('<div class="wrapped-link">')
           .append('<div class="col-zero play item-content">');

      var that = this;
      ['title col-one item-content',
       'artist col-two item-content',
       'other col-three item-content',
       'playCount col-four item-content',
       'url item-data',
       '_id item-data',
       'category item-data'].forEach(function(classList) {
          var nextVal  = $('<div class="' + classList + '">');
          nextVal.text(that.model[classList.split(' ')[0]]);
          link.append(nextVal);
       });

      $(this.el).prepend(link);
      link.hide().fadeIn(1000);
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
      'click .link': 'addLinkModal',
      'click .extract': 'extractModal'
   },

   render: function() {
      $(this.el).show();
   },

   unrender: function() {
      $(this.el).hide();
   },

   addLinkModal: function() {
      new dynamic.AddLinkModal();
   },

   extractModal: function() {
      new dynamic.ExtractModal();
   }
});
