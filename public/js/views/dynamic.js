'use strict';

var View = require('./view');
var model = require('../model');
var util = require('../util');

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
      var active = model.list.get('activeList');
      var other = [];

      model.user.get('categories').forEach(function(c) {
         var option = {
            name: c.name,
            id: c.id
         };

         if (active.type === 'playlist' || !active.type) {
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
      this.processing = opt.processing;
      this.render('confirm', this.model);
   },

   save: function(e) {
      e.preventDefault();
      if (this.processing) {
         $('#confirm-modal').val(this.processing);
      }
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
      var active = model.list.get('activeList');

      model.list.editLink(this.el, function(err, updated) {
         if (err) {
            new Notification(err);
         } else {
            if (active.type === 'category' && updated.category !== category) {
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
      init: function(model) {
         var select = new CategorySelect();
         this.model = model || {newLink: true};
         this.model.categorySelect = select.render().html();
         this.render('add', this.model);
      },

      events: {
         'input .new-link': 'getDetails'
      },

      save: function(e) {
         e.preventDefault();
         var that = this;

         model.list.addLink(this.el, function(err, res) {
            if (err) {
               new Notification(err);
            } else {
               var model = res.data;
               var newLink = new Link(model);
               var active = model.list.get('activeList');

               if (active.type === 'category' && active.id === model.category) {
                  newLink.render();
               }

               model.list.get('activeList').length++;
               $('#add-playing').hide();
               $('#empty-list').hide();
               that.unrender();

               new Notification(res);
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
         var select = new CategorySelect();
         this.file = null;
         this.model = {
            categorySelect: select.render().html()
         };

         if (!window.FileReader) {
             return new Notification({
               type: 'error',
               msg: 'Your browser does not support this feature.'
            });
         }

         this.render('extract', this.model);
      },

      events: {
         'change .input-file': 'loadFile'
      },

      loadFile: function() {
         this.file = $('.input-file', this.el)[0].files[0];
         $('.file-name', this.el).text(this.file.name + ' (' + Math.round(this.file.size*10/1024)/10 + ' KB)');
      },

      save: function(e) {
         e.preventDefault();
         var that = this;
         var category = util.serialize(this.el).category;

         if (!category) {
            return new Notification({
               type: 'error',
               msg: 'Links must be extracted to a collection.'
            });
         }

         if (!this.file) {
            return new Notification({
               type: 'error',
               msg: 'No file selected.'
            });
         }

         if (this.file.size > 1024 * 1024 * 5) {
            return new Notification({
               type: 'error',
               msg: 'The selected file is too large.'
            });
         }

         $(this.el).find('.submit').val('Extracting...');

         model.list.extract(this.file, category, function(err, report) {
            if (err) {
               $(that.el).find('.submit').val('Extract');
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
         var active = model.list.get('activeList');
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
            playlists: model.user.get('playlists'),
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

         if (this.model.playlists.length > 5) {
            $('.playlist-options', this.el).customScroll();
         }
      },

      play: function() {
         model.player.play(this.model.link);
      },

      details: function() {
         new DetailsModal(this.model.link);
      },

      deleteLinks: function() {
         var selected = this.model.selected;
         var plural = (selected.length > 1) ? 's' : '';
         var active = model.list.get('activeList');
         var links = [];

         selected.each(function() {
            links.push($(this).find('._id').text());
         });

         var confirmDelete = new ConfirmModal({
            msg: 'Confirm deletion of <strong>' + links.length + '</strong> link' + plural + '.',
            processing: 'Deleting...',
            action: function() {
               model.list.deleteLinks(active.id, links, function(err) {
                  confirmDelete.unrender();
                  if (err) {
                     new Notification(err);
                  } else {
                     var deleted = links.length;
                     active.length -= deleted;

                     selected.fadeOut(1000, function() {
                        selected.remove();
                        if (active.length < 1 && --deleted === 0) {
                           $('#empty-list').show();
                        }
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
         var active = model.list.get('activeList');

         selected.each(function() {
            positions.push(parseInt($(this).find('.order').text()));
         });

         model.list.removeFromPlaylist(playlist, positions, function(err) {
            if (err) {
               new Notification(err);
            } else {
               var removed = selected.length;
               active.length -= removed;
               selected.fadeOut(1000, function() {
                  selected.remove();
                  if (--removed === 0) {
                     if (active.length < 1) {
                        return $('#empty-list').show();
                     }
                     model.list.updateOrder();
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

         model.list.addToPlaylist(id, links, function(err, report) {
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
         var settings = model.user.get('settings');
         var suggestions = settings.suggestions;

         this.model = {
            display: model.user.get('display'),
            email: model.user.get('email'),
            type: model.user.get('type'),
            checkSuggest: (suggestions !== '') ? 'checked' : '',
            source: suggestions,
            passLock: true
         };

         this.render('settings', this.model);
      },

      events: {
         'click #unlock-password': 'editPassword'
      },

      save: function(e) {
         e.preventDefault();
         var that = this;
         var form = util.serialize(this.el);
         if (form.display.length > 14) {
            return new Notification({
               type: 'error',
               msg: 'Display must be less then 15 characters.'
            });
         }

         var edit = {
            display: form.display,
            email: form.email,
            settings: {
               suggestions: form.suggestions,
               theme: form.theme,
               sideBar: form.sideBar
            }
         };

         if (!this.model.passLock) {
            if (!form.password || form.password !== form.passConfirm) {
               return new Notification({
                  type: 'error',
                  msg: 'Passwords are required and must match.'
               });
            }
            edit.editPass = {
               password: form.password,
               passConfirm: form.passConfirm,
               currPassword: form.currPassword
            };
         }

         if (form.showSuggestions !== 'on') {
            edit.settings.suggestions = '';
            $('#suggestion-feed').html('<img class="feed-logo" src="/img/feedLogo.png">');
         }

         model.user.editUser(edit, function(err, res) {
            if (err) {
               new Notification(err);
            } else {
               var updated = res.data;
               model.user.set('display', updated.display);
               model.user.set('email', updated.email);
               model.user.set('settings', updated.settings);

               // render display
               $('.display', '#user-controls').text(updated.display);
               that.unrender();

               if (updated.newEmail) {
                  new Notification(res);
               }
            }
         });
      },

      editPassword: function(e, trigger) {
         if (this.model.type !== 'local' || model.ui.cooldown()) {
            return false;
         }

         if (this.model.passLock) {
            $('.new-password', this.el).prop('disabled', false).val('');
            $('.edit-container', this.el).slideDown(400);
            trigger.attr('class', 'unlocked');
         } else {
            $('.new-password', this.el).prop('disabled', true).val('.......');
            $('.edit-container', this.el).slideUp(400);
            trigger.attr('class', 'locked');
         }

         this.model.passLock = !this.model.passLock;
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
         'keyup .new-title': 'check',
         'click form': 'protect',
         'submit form': 'save'
      },

      protect: function(e) {
         if (model.ui.get('minBar')) {
            e.stopPropagation();
         }
      },

      render: function() {
         $('.new-list', '#side-bar').remove();

         if (model.ui.get('minBar')) {
            model.ui.set('menuProtect', true);
            $('#' + this.type + '-manager').show();
         }

         var input = $('<input type="text" class="new-title" spellcheck="false">');
         var form = $('<form>')
                   .append(input)
                   .append('<img class="save-new" src="/img/finishRename.png">')
                   .append('<img class="cancel-new" src="/img/cancelRename.png">');

         this.el.empty().append(form);
         $(this.mount).append(this.el);
         this.el.hide().fadeIn(200);
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
            var lists = model.user.get(this.collective);
            var that = this;

            var newList = {
               name: that.newList,
               order: lists.length
            };

            model.list.addList(this.type, newList, function(err, id) {
               if (err) {
                  new Notification(err);
               } else {
                  lists.push({
                     name: newList.name,
                     order: newList.order,
                     id: id
                  });

                  model.user.set(that.collective, lists);
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
