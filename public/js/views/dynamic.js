'use strict';

var View = require('./view');
var util = require('../util');
var library = require('../model/library');

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

         head.append('<label>Link</label>')
             .append(this.select.render().el)
             .append(this.link);

         ['Title', 'Artist', 'Other'].forEach(function(field) {
            var section = $('<div class="modal-section">')
                    .append('<label>' + field + '</label>')
                    .append('<input type="text" name="' + field.toLowerCase() + '">');

            this.edit.append(section);
         }, this);

         this.el.append(head).append(this.edit)
                .append(this.close).append(this.submit);

         $('body').append(this.cover).append(this.el);
      }
   }),

   ExtractModal: Modal.extend({
      init: function() {
         this.el.attr('enctype', 'multipart/form-data');
         this.render();
      },

      render: function() {
         var select = new CollectionSelect();
         this.submit.val('Extract');

         this.el.append('<input id="upload-input" type="file" name="links">')
                .append(select.render().el)
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

         this.model = util.buildModel(link);
         this.model.position = {
            x: x,
            y: y
         };

         this.el.empty();
         this.render();
      },

      events: {
         
      },

      render: function() {
         ['play Play', 
          'playlist Add to playlist',
          'details Details',
          'delete Delete'].forEach(function(data) {
            var className = data.substr(0, data.indexOf(' '));
            var text = data.substr(data.indexOf(' ') + 1);
            var option = $('<div class="' + className + '">' + text + '</div>');
            this.el.append(option);
         }, this);

         this.el.css('left', this.model.position.x);
         this.el.css('top', this.model.position.y);
         $('body').append(this.el);
      }
   })
};
