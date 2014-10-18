'use strict';

var View = require('./view.js');
var dynamic = require('./dynamic.js');

// main view
module.exports = View.extend({
   el: 'html',

   init: function() {
      // connect model
      this.model.init(this);

      this.sideBar = new SideBarView;
      this.player = new PlayerView;
      this.list = new ListView;

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

var SideBarView = View.extend({
   el: '#side-bar',

   init: function() {
      this.tools = new ToolsView;
   },

   events: {
      'click #collapse-bar': 'collapse',
      'click #expand-bar': 'expand'
   },

   expand: function() {
      this.model.set('minBar', false);
   },

   collapse: function() {
      this.model.set('minBar', true);
   }
});

var PlayerView = View.extend({
   el: '#player-view'

   
});

var ListView = View.extend({
   el: '#list-view',

   init: function() {
      var list = $('.selected.category-title').text();
      this.model.loadList(list);

      var search = new SearchView;
   },

   events: {
      'click #list-head .sortable': 'sort',
   },

   render: function(html) {
      $('#list-body', this.el).html(html);
   },

   addLink: function(model) {
      var newLink = new LinkView(model);
   },

   sort: function(e) {
      var el = $(e.target);
      this.model.sort({
         cell: el.data('col'),
         numeric: el.data('numeric')
      });
   }
});

var SearchView = View.extend({
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

var LinkView = View.extend({
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


var ToolsView = View.extend({
   el: '#player-tools',

   init: function() {
      this.addMenu = new AddMenuView;
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

var AddMenuView = View.extend({
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
