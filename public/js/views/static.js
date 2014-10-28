'use strict';

var View = require('./view.js');
var dynamic = require('./dynamic.js');
var util = require('../util');

// main view
module.exports = View.extend({
   el: 'html',

   init: function() {
      // connect model
      this.model.init(this);

      this.sideBar = new SideBar;
      this.player = new Player;
      this.list = new List;

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
      } else if (this.model.get('minBar')) {
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
      this.mainMenu = new MainMenu;
      this.tools = new Tools;
   },

   events: {
      'click #collapse-bar': 'collapse',
      'click #expand-bar': 'expand',
      'click #main-button': 'toggleMainMenu',
      'click .category-title': 'renderCategory',
      'click .playlist-title': 'renderPlaylist'
   },

   expand: function() {
      this.model.set('minBar', false);
   },

   collapse: function() {
      this.model.set('minBar', true);
   },

   toggleMainMenu: function() {
      if (this.model.get('cooldown')) {
         return false;
      }

      this.model.set('cooldown', true);
      this.mainMenu.render();
   },

   renderCategory: function(e, trigger) {
      var name = trigger.text().toLowerCase();
      $('li', this.el).removeClass('selected');
      trigger.addClass('selected');

      this.model.set('activeList', {
         type: 'category',
         name: name
      });
   },

   renderPlaylist: function(e, trigger) {
      var name = trigger.text().toLowerCase();
      $('li', this.el).removeClass('selected');
      trigger.addClass('selected');

      this.model.set('activeList', {
         type: 'playlist',
         name: name
      });
   }
});

var Player = View.extend({
   el: '#player-view',

   init: function() {
      this.resizeButtons = new ResizeButtons;
      this.playing = new NowPlaying;
   },

   render: function() {
      var height = this.model.get('playerHeight');
      var currHeight = $(this.el).height();

      $('#link-list').css('top', 60);
      if (height > 0) {
         $(this.el).css('margin-top', 0);
         $(this.el).height(this.model.get('playerHeight'));
      } else {
         $(this.el).css('margin-top', currHeight * -1);
      }
   }
});

var NowPlaying = View.extend({
   el: '#now-playing',

   render: function() {
      $(this.el).text(this.model.get('playing'));
   }
});

var MainMenu = View.extend({
   el: '#main-menu',

   render: function() {
      var menu = $(this.el);
      if ($(this.el).is(':visible')) {
         $(this.el).animate({height: 0}, 300, function() {
            menu.hide();
         });
      } else {
         menu.css('display', 'block');
         $(this.el).animate({height: 145}, 300);
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

      if (this.model.get('cooldown')) {
         return false;
      }

      var size = trigger.attr('id');
      var sizeMap = {
         'no-view': 0,
         'normal-view': 300,
         'large-view': 500
      };

      this.model.set('cooldown', true);
      this.model.set('playerHeight', sizeMap[size]);
   }
});

var List = View.extend({
   el: '#link-list',

   init: function() {
      this.search = new Search;
      this.model.loadList();
   },

   events: {
      'click #list-head .sortable': 'sort',
      'click .wrapped-link': 'select',
      'dblclick .wrapped-link': 'play'
   },

   render: function(content) {
      if (content) {
         if (content === 'empty'){
            // TODO
            // populate list options
         } else {
            $('#list-body', this.el).html(content);
         }
      }

      $(this.el).css('top', this.model.get('playerHeight') + 40);
   },

   play: function(e, trigger) {
      var link = util.buildModel(trigger.closest('.wrapped-link'));
      this.model.set('playing', link.title + ' - ' + link.artist);
      this.model.play(link);
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
      var active = this.model.get('activeList');
      if (active.type === 'category' && active.name  === model.category) {
         newLink.render();
      }
   },

   sort: function(e) {
      var el = $(e.target);
      this.model.sort({
         cell: el.data('col'),
         numeric: el.data('numeric')
      });
   }
});

var Search = View.extend({
   el: '#search-view',

   events: {
      'focus input': 'expand',
      'blur input': 'collapse',
      'keyup input': 'search'
   },

   expand: function() {
      $('input', this.el).css('width', '30%');
   }, 

   collapse: function() {
      $('input', this.el).css('width', '20%');
   },

   search: (function() { // avoid typing lag
      var delay = 0;

      return function() {
         var that = this;
         clearTimeout(delay);
         delay = setTimeout(function() {
            that.model.search({
               term: $('input', this.el).val(),
               cells: [1,2,3,4]
            });
         }, 400);
      }
   }())
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
      this.addMenu = new AddMenu;
   },

   events: {
      'click #add-button': 'toggleAddMenu',
      'click #shuffle': 'toggleShuffle',
      'click #repeat': 'toggleRepeat'
   },

   toggleAddMenu: function(e) {
      e.stopPropagation();
      $('.wrapped-link').removeClass('selected');

      if ($('#add-menu').is(':visible')) {
         this.addMenu.unrender();
      } else {
         this.addMenu.render();
      }
   },

   toggleShuffle: function() {
      var shuffle = $('#shuffle', this.el);
      if (shuffle.hasClass('active')) {
         shuffle.attr('src', '/img/shuffle.png')
                .removeClass('active');
      } else {
         shuffle.attr('src', '/img/shuffleActive.png')
                .addClass('active');
      }
   },

   toggleRepeat: function() {
      var repeat = $('#repeat', this.el);
      if (repeat.hasClass('active')) {
         repeat.attr('src', '/img/repeat.png')
               .removeClass('active');
      } else {
         repeat.attr('src', '/img/repeatActive.png')
               .addClass('active');
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
      var addLink = new dynamic.AddLinkModal;
   },

   extractModal: function() {
      var extract = new dynamic.ExtractModal;
   }
});
