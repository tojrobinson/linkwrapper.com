'use strict';

var View = require('./view');
var util = require('../util');
var library = require('../model/library');
var player = require('../model/player');
var user = require('../model/user');

var Modal = View.extend({
   el: $('<form class="theme player-modal">'), // reusable
   cover: $('<div class="view-cover">'),
   render: function(name, model) {
      var template = $('#' + name + '-template').html();
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
      var active = library.get('activeList');
      var other = [];

      user.get('categories').forEach(function(c) {
         var option = {
            name: c.name,
            id: c.id
         };

         if (active.type === 'playlist') {
            other.push(option);
         } else if (c.id !== active.id) {
            other.push({
               name: c.name,
               id: c.id
            });
         }
      });

      this.model = {
         other: other
      };

      if (active.type === 'category') {
         this.model.active = active;
      }

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
         msg: opt.msg
      };
      this.action = opt.action;
      this.cleanUp = opt.cleanUp;
      this.render('confirm', this.model);
   },

   save: function(e) {
      e.preventDefault();
      this.action();
   },

   unrender: function() {
      if (this.cleanUp) {
         this.cleanUp();
      }
      this.cover.remove();
      this.el.empty().remove();
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
            new Notification(err);
         } else {
            if (updated.category !== category) {
               link.fadeOut(1000, function() {
                  link.remove();
               });
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

var Link = View.extend({
   el: '#list-body',

   init: function(model) {
      this.model = model;
   },

   render: function() {
      var link = $('<div class="wrapped-link">');
      var template = $('#link-template').html();
      var rendered = Mustache.render(template, this.model);
      link.html(rendered);

      $(this.el).prepend(link);
      link.hide().fadeIn(1000);
   }
});

var Notification = View.extend({
   mount: '#notifications',

   init: function(model) {
      this.msg = model.msg;
      this.el = $('<div class="notify-box">');

      var that = this;
      var style = {
         'error': 'error',
         'default': 'default'
      };

      this.type = style[model.type] || 'default';

      this.render();
      setTimeout(function() {
         that.unrender();
      }, 10000);
   },

   events: {
      'click .close-notification': 'unrender'
   },

   render: function() {
      var message = $('<div class="notify-body">' + this.msg + '</div>');
      var close = $('<div class="close-notification ' + this.type + '">');

      this.el.addClass(this.type)
             .append(message)
             .append(close);

      $(this.mount).append(this.el);
      this.el.hide().fadeIn(500);
   },

   unrender: function() {
      $(this.el).remove();
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
         'input .new-link': 'getDetails'
      },

      save: function(e) {
         e.preventDefault();
         var that = this;

         library.addLink(this.el, function(err, model) {
            if (err) {
               new Notification(err);
            } else {
               var newLink = new Link(model);
               var active = library.get('activeList');
               if (active.type === 'category' && active.id === model.category) {
                  newLink.render();
               }
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
         library.extract(this.el, function(err, report) {
            if (err) {
               new Notification(err);
            } else {
               that.unrender();
               new Notification(report);
            }
         });
      }
   }),

   LinkMenu: ClickMenu.extend({
      init: function(e, link) {
         var x = e.clientX;
         var y = e.clientY;
         var menuHeight = 120;
         var menuWidth = 180;
         var selected = $('.wrapped-link.selected');
         var active = library.get('activeList');
         var removal = (active.type === 'category') ? 'Delete' : 'Remove';

         var options = {
            play: 'Play',
            details: 'Details',
            playlist: 'Add to playlist',
            'delete': removal
         };

         if (selected.length > 1) {
            options.playlist = 'Add all to playlist';
            options['delete'] = removal + ' all';
         }

         if ((x + menuWidth) > $(window).width()) {
            x -= menuWidth;
         }

         if ((y + menuHeight) > $(window).height()) {
            y -= menuHeight;
         }

         this.model = {
            link: util.buildLink(link),
            menuHeight: menuHeight,
            menuWidth: menuWidth,
            shifted: false,
            position: {
               x: x,
               y: y
            },
            options: options,
            selected: selected,
            playlists: user.get('playlists'),
            removal: removal.toLowerCase(),
            active: active
         };
         
         this.el.empty();
         this.render();
      },

      events: {
         'click .play': 'play',
         'click .delete': 'deleteLinks',
         'click .remove': 'removeLinks',
         'click .details': 'details',
         'click .add-to': 'shiftMenu',
         'click .back-to': 'shiftMenu',
         'click .playlist': 'playlist'
      },

      render: function() {
         var template = $('#menu-template').html();
         var rendered = Mustache.render(template, this.model);

         this.el.html(rendered);
         this.el.css('height', this.model.menuHeight);
         this.el.css('left', this.model.position.x);
         this.el.css('top', this.model.position.y);

         $('body').append(this.el);
      },

      play: function() {
         player.play(this.model.link);
      },

      details: function() {
         new DetailsModal(this.model.link);
      },

      deleteLinks: function() {
         var selected = this.model.selected;
         var plural = (selected.length > 1) ? 's' : '';
         var links = [];

         selected.each(function() {
            links.push($(this).find('._id').text());
         });

         var confirmDelete = new ConfirmModal({
            msg: 'Confirm deletion of <strong>' + links.length + '</strong> link' + plural + '.',
            action: function() {
               library.deleteLinks(links, function(err) {
                  confirmDelete.unrender();
                  if (err) {
                     new Notification(err);
                  } else {
                     selected.fadeOut(1000, function() {
                        selected.remove();
                     });
                  }
               });
            }
         });
      },

      removeLinks: function() {
         var selected = this.model.selected;
         var playlist = this.model.active.id;
         var positions = [];

         selected.each(function() {
            positions.push(parseInt($(this).find('.order').text()));
         });

         library.removeFromPlaylist(playlist, positions, function(err, report) {
            if (err) {
               new Notification(err);
            } else {
               var removed = selected.length;
               selected.fadeOut(1000, function() {
                  selected.remove();
                  if (--removed === 0) {
                     library.loadList();
                  }
               });
            }
         });
      },

      shiftMenu: function(e) {
         e.stopPropagation();
         if (this.shifted) {
            this.el.css('height', this.model.menuHeight);
            this.el.find('.menu-body').animate({left: 0}, 200);
         } else {
            this.el.css('height', 180);
            this.el.find('.menu-body').animate({left: -180}, 200);
         }

         this.shifted = !this.shifted;
      },

      playlist: function(e, trigger) {
         var id = trigger.find('.id').val();
         var links = [];

         this.model.selected.each(function() {
            var linkId = $(this).find('._id').text();
            links.push(linkId);
         });

         library.addToPlaylist(id, links, function(err, report) {
            if (err) {
               new Notification(err);
            } else {
               new Notification(report);
            }
         });
      }
   }),

   SettingsModal: Modal.extend({
      init: function() {
         var settings = user.get('settings');
         var suggestions = settings.suggestions;

         this.model = {
            display: user.get('display'),
            email: user.get('email'),
            checkSuggest: (suggestions !== '') ? 'checked' : '',
            source: suggestions
         };
         this.render('settings', this.model);
      },

      save: function(e) {
         e.preventDefault();
         var that = this;
         var data = util.serialize(this.el);
         var edit = {
            display: data.display,
            email: data.email,
            settings: {
               suggestions: data.suggestions,
               theme: data.theme,
               sideBar: data.sideBar
            }
         };

         if (data.showSuggestions !== 'on') {
            edit.settings.suggestions = '';
            $('#suggestion-feed').html('<img class="feed-logo" src="/img/feedLogo.png">');
         }

         user.editUser(edit, function(err, report) {
            if (err) {
               new Notification(err);
            } else {
               user.set('display', edit.display);
               user.set('email', edit.email);
               user.set('settings', edit.settings);

               // render display
               $('.display', '#user-controls').text(edit.display);
               that.unrender();
            }
         });
      }
   }),

   NewList: View.extend({
      el: $('<div class="new-list">'),

      init: function(type) {
         this.type = type;
         this.newList = '';
         this.valid = false;
         this.collective = (type === 'category') ? 'categories' : 'playlists';
         this.mount = '#' + this.type + '-titles';

         this.el.empty();
         this.render();
         this.check();
      },

      events: {
         'click .cancel-new': 'unrender',
         'click .save-new': 'save',
         'submit .list-form': 'save',
         'keyup .new-title': 'check'
      },

      render: function() {
         $('.new-list', '#side-bar').remove();

         var input = $('<input type="text" class="new-title" spellcheck="false">');
         var form = $('<form class="list-form">')
                   .append(input)
                   .append('<img class="save-new" src="/img/finishRename.png">')
                   .append('<img class="cancel-new" src="/img/cancelRename.png">');

         this.el.empty().append(form);
         $(this.mount).append(this.el);
         this.el.hide().fadeIn(400);
         input.focus();
      },

      unrender: function() {
         $(this.el).remove();
      },

      close: function() {
         this.unrender();
      },

      check: function() {
         var save = $(this.el).find('.save-new');
         this.newList = $(this.el).find('.new-title').val().trim();

         if (!this.newList) {
            save.addClass('disabled');
         } else {
            save.removeClass('disabled');
         }
      },

      save: function(e) {
         e.preventDefault();

         if (this.newList) {
            var lists = user.get(this.collective);
            var that = this;

            var newList = {
               name: that.newList,
               order: lists.length
            };

            library.addList(this.type, newList, function(err, id) {
               if (err) {
                  new Notification(err);
               } else {
                  lists.push({
                     name: newList.name,
                     order: newList.order,
                     id: id
                  });

                  user.set(that.collective, lists);
                  that.unrender();
               }
            });
         } else {
            new Notification({
               type: 'error',
               msg: 'Title must not be empty.'
            });
         }
      }
   }),

   ConfirmModal: ConfirmModal,
   Notification: Notification
};
