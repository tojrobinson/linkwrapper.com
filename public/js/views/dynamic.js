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
