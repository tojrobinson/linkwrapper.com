'use strict';
var View = require('./view.js');

var Modal = View.extend({
   el: $('<form class="theme player-modal">'), // create el for dynamic view
   cover: $('<div class="view-cover">'),
   close: $('<div class="close-modal">'),
   submit: $('<input type="submit" class="form-button">'),
   unrender: function() {
      this.cover.remove();
      this.el.empty().remove();
   },
   events: {
      'click .close-modal': 'unrender'
   }
});

var ClickMenu = View.extend({
   el: $('<div class="click-menu">'),
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
         this.select = new CollectionSelect;

         this.linkEvents();
         this.render();
      },

      linkEvents: function() {
         var that = this;
         this.el.submit(function(e) {
            e.preventDefault();
            // TODO
            // model logic
         });

         this.link.on('input', function() {
            // TODO
            // fetch details
            // from youtube
            that.edit.slideDown(1000);
         });
      },

      link: $('<input type="text" name="url">'),
      edit: $('<div class="edit-container">'),

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

         this.extractEvents();
         this.render();
      },

      extractEvents: function() {
         var that = this;
         this.submit.click(function(e) {
            e.preventDefault();
            // TODO
            // model logic
         });
      },

      render: function() {
         var select = new CollectionSelect;
         this.submit.val('Extract');

         this.el.append('<input id="upload-input" type="file" name="links">')
                .append(select.render().el)
                .append(this.submit)
                .append(this.close);

         $('body').append(this.cover).append(this.el);
      }
   })
};
