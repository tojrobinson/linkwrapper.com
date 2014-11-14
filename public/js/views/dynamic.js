'use strict';

var View = require('./view');
var util = require('../util');
var library = require('../model/library');
var player = require('../model/player');

var Modal = View.extend({
   el: $('<form class="theme player-modal">'), // reusable
   cover: $('<div class="view-cover">'),
   close: $('<div class="close-modal">'),
   submit: $('<input type="submit" class="submit form-button">'),
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

var CollectionSelect = View.extend({
   el: $('<select name="category" class="collection-list">'),

   init: function() {
      this.el.empty();
   },

   render: function() {
      var that = this;
      var selected = $('.category-title.selected').text() || '';
      $('.category-title').each(function(key, name) {
         var option = $('<option>');
         option.text($(name).text());
         option.val($(name).text().toLowerCase());
         if (option.text().toLowerCase() === selected.toLowerCase()) {
            option.attr('selected', 'selected');
         }
         that.el.append(option);
      });
      return this;
   }
});


var ConfirmModal = Modal.extend({
   init: function(opt) {
      this.message = opt.message;
      this.action = opt.action;
      this.render();
   },

   render: function() {
      this.submit.val('Confirm');
      this.el.append('<div class="modal-text">' + this.message + '</div>')
             .append(this.submit)
             .append(this.close);

      $('body').append(this.cover).append(this.el);
   },

   save: function(e) {
      e.preventDefault();
      this.action();
   }
});

var DetailsModal = Modal.extend({
   init: function(model) {
      this.model = model;
      this.select = new CollectionSelect();
      this.render();
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
   },

   render: function() {
      this.submit.val('Save');

      var head = $('<div class="modal-section link">')
                  .append(this.select.render().el)
                  .append('<input type="text" name="url" class="url" value="' + this.model.url + '">');
             
      this.el.append(head);

      ['Title', 'Artist', 'Other'].forEach(function(label) {
         var name = label.toLowerCase();
         var section = $('<div class="modal-section">')
                 .append('<label>' + label + '</label>')
                 .append('<input type="text" value="' + this.model[name] + '" name="' + name + '">');

         this.el.append(section);
      }, this);

      this.el.append('<input type="hidden" name="id" value="' + this.model.id + '">')
             .append(this.submit)
             .append(this.close);

      $('body').append(this.cover).append(this.el);
   }
});

module.exports = {
   AddLinkModal: Modal.extend({
      init: function() {
         this.select = new CollectionSelect();
         this.render();
      },

      link: $('<input type="text" name="url" class="url">'),
      edit: $('<div class="edit-container">'),

      events: {
         'input .url': 'getDetails'
      },

      save: function(e) {
         e.preventDefault();
         var that = this;

         library.addLink(this.el, function(data) {
            if (data) {
               that.unrender();
            } else {
               // TODO
               // flash failure
            }
         });
      },

      getDetails: function() {
         // TODO
         // fetch details
         // from youtube
         this.edit.slideDown(1000);
      },

      render: function() {
         var head = $('<div class="modal-section link">');
         this.submit.val('Save');
         this.edit.html('').hide();

         head.append(this.select.render().el)
             .append(this.link);

         ['Title', 'Artist', 'Other'].forEach(function(field) {
            var section = $('<div class="modal-section">')
                    .append('<label>' + field + '</label>')
                    .append('<input type="text" name="' + field.toLowerCase() + '">');

            this.edit.append(section);
         }, this);

         this.el.append(head)
                .append(this.edit)
                .append(this.close)
                .append(this.submit);

         $('body').append(this.cover).append(this.el);
      }
   }),

   ExtractModal: Modal.extend({
      init: function() {
         this.el.attr('enctype', 'multipart/form-data');
         this.render();
      },

      render: function() {
         this.submit.val('Extract');
         var select = new CollectionSelect();
         var body = $('<div class="modal-section">');

         body.append(select.render().el)
             .append('<input id="upload-input" type="file" name="links">');

         this.el.append(body)
             .append(this.submit)
             .append(this.close);

         $('body').append(this.cover).append(this.el);
      },

      save: function(e) {
         e.preventDefault();
         var that = this;
         library.extract(this.el, function(data) {
            if (data) {
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
            selected: $('.wrapped-link.selected')
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
         ['play Play', 
          'details Details',
          'playlist Add to playlist',
          'delete Delete'].forEach(function(data) {
            var className = data.substr(0, data.indexOf(' '));
            var text = data.substr(data.indexOf(' ') + 1);
            var option = $('<div class="' + className + '">' + text + '</div>');
            this.el.append(option);
         }, this);

         if (this.model.selected.length > 1) {
            this.el.find('.delete').text('Delete all');
            this.el.find('.playlist').text('Add all to playlist');
         }
         this.el.css('left', this.model.position.x);
         this.el.css('top', this.model.position.y);
         $('body').append(this.el);
      },

      play: function() {
         player.play(this.model.link.obj);
      },

      details: function() {
         var detailsModal = new DetailsModal(this.model.link);
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
   })
};
