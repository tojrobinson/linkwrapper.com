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

      this.render();
   },

   events: {
      'click body': 'clearState',
      'resize window': 'render'
   },

   clearState: function() {
      $('.click-menu').hide();
   },

   render: function(e) {
      var width = $(window).width();

      if (width < 1000) {
         if (width < 700) {
            $(this.el).addClass('min-list');
         } else {
            $(this.el).removeClass('min-list');
         }

         $(this.el).addClass('collapse');
      } else {
         $(this.el).removeClass('collapse min-list');
      }
   }
});

var SideBarView = View.extend({
   el: '#side-bar',

   init: function() {
      this.tools = new ToolsView;
   }
});

var PlayerView = View.extend({

});

var ListView = View.extend({
   el: '#list-body',

   init: function() {
      var list = $('.selected.category-title').text();
      this.model.loadList(list);
   },

   render: function(html) {
      $(this.el).html(html);
   },

   addLink: function(model) {
      var newLink = new LinkView(model);
   }
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
      'click #add-button': 'renderAddMenu',
      'click #shuffle': 'toggleShuffle',
      'click #repeat': 'toggleRepeat'
   },

   renderAddMenu: function(e) {
      e.stopPropagation();
      this.addMenu.render();
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

   addLinkModal: function() {
      var addLink = new dynamic.AddLinkModal;
   },

   extractModal: function() {
      var extract = new dynamic.ExtractModal;
   }
});
