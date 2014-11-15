'use strict';

var View = require('./view');
var util = require('../util');
var library = require('../model/library');
var player = require('../model/player');

var Modal = View.extend({
   el: $('<form class="theme player-modal">'), // reusable
   cover: $('<div class="view-cover">'),
   render: function(template, model) {
      var template = $('#' + template + '-template').html();
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
      var selected = $('.category-title.selected').text() || '';
      var other = [];

      $('.category-title').each(function(key, name) {
         name = $(name).text();
         if (name !== selected) {
            other.push({
               name: name,
               val: name.toLowerCase()
            });
         }
      });

      this.model = {
         selected: {
            name: selected,
            val: selected.toLowerCase()
         },

         other: other
      };
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
         message: opt.message
      };
      this.action = opt.action;
      this.render('confirm', this.model);
   },

   save: function(e) {
      e.preventDefault();
      this.action();
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

      library.editLink(this.el, function(err, updated) {
         if (err) {
            // TODO
            // flash error
         } else {
            if (updated.category !== category) {
               link.remove();
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

module.exports = {
   AddLinkModal: Modal.extend({
      init: function() {
         var select = new CategorySelect();
         this.model = {
            categorySelect: select.render().html()
         };
         this.render('add', this.model);
      },

      events: {
         'input .url': 'getDetails'
      },

      save: function(e) {
         e.preventDefault();
         var that = this;

         library.addLink(this.el, function(err) {
            if (err) {
               // TODO
               // flash fail
            } else {
               that.unrender();
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
         this.el.attr('enctype', 'multipart/form-data');
         var select = new CategorySelect();
         this.model = {
            categorySelect: select.render().html()
         };
         this.render('extract', this.model);
      },

      save: function(e) {
         e.preventDefault();
         var that = this;
         library.extract(this.el, function(err) {
            if (err) {
               // TODO
               // flash fail
            } else {
               that.unrender();
            }
         });
      }
   }),

   LinkMenu: ClickMenu.extend({
      init: function(e, link) {
         var x = e.clientX;
         var y = e.clientY;
         var menuHeight = 140;
         var menuWidth = 120;
         var selected = $('.wrapped-link.selected');
         var options = {
            play: 'Play',
            details: 'Details',
            playlist: 'Add to playlist',
            'delete': 'Delete'
         };

         if (selected.length > 1) {
            options.playlist = 'Add all to playlist';
            options['delete'] = 'Delete all';
         }

         if ((x + menuWidth) > $(window).width()) {
            x -= menuWidth;
         }

         if ((y + menuHeight) > $(window).height()) {
            y -= menuHeight;
         }

         this.model = {
            link: util.buildLinkModel(link),
            position: {
               x: x,
               y: y
            },
            options: options,
            selected: selected
         };

         this.el.empty();
         this.render();
      },

      events: {
         'click .play': 'play',
         'click .delete': 'deleteLinks',
         'click .details': 'details'
      },

      render: function() {
         var template = $('#menu-template').html();
         var rendered = Mustache.render(template, this.model.options);

         this.el.html(rendered);
         this.el.css('left', this.model.position.x);
         this.el.css('top', this.model.position.y);

         $('body').append(this.el);
      },

      play: function() {
         player.play(this.model.link.obj);
      },

      details: function() {
         new DetailsModal(this.model.link);
      },

      deleteLinks: function() {
         var linkIds = [];
         var selected = this.model.selected;
         var plural = (selected.length > 1) ? 's' : '';

         this.model.selected.each(function() {
            linkIds.push($(this).find('._id').text());
         });

         var confirmModal = new ConfirmModal({
            message: 'Confirm deletion of <strong>' + linkIds.length + '</strong> link' + plural + '.',
            action: function() {
               library.deleteLinks(linkIds, function(err) {
                  if (err) {
                     // TODO
                     // flash error
                  } else {
                     confirmModal.unrender();
                     selected.fadeOut(1000, function() {
                        selected.remove();
                     });
                  }
               });
            }
         });
      }
   }),

   SettingsModal: Modal.extend({
      init: function() {
         this.model = {

         };
         this.render('settings', this.model);
      },

      save: function(e) {
         e.preventDefault();
      }
   })
};
