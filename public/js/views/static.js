'use strict';

var View = require('./view.js');
var dynamic = require('./dynamic.js');

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
      $('.click-menu').hide();
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
      'click #main-button': 'toggleMainMenu'
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
   }
});

var Player = View.extend({
   el: '#player-view',

   init: function() {
      this.resizeButtons = new ResizeButtons;
   },

   render: function() {
      var height = this.model.get('playerHeight');
      var currHeight = $(this.el).height();

      if (height > 0) {
         $(this.el).css('margin-top', 0);
         $(this.el).height(this.model.get('playerHeight'));
      } else {
         $(this.el).css('margin-top', currHeight * -1);
      }
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
   el: '#list-view',

   init: function() {
      var list = $('.selected.category-title').text();
      this.model.loadList(list);

      var search = new Search;
   },

   events: {
      'click #list-head .sortable': 'sort',
   },

   render: function(html) {
      $('#list-body', this.el).html(html);
   },

   addLink: function(model) {
      var newLink = new Link(model);
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
      this.render();
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
