'use strict';

var db = require('r/app/util/db');
var path = require('path');
var crypto = require('crypto');
var autoInc = 0;

module.exports = {
   bookmarks: path.join(__dirname, 'bookmarks.html'),
   user: function() {
      return {
         display: 'RMS',
         email: 'richard.stallman@linkwrapper.com' + autoInc++,
         password: 'g-noo not GNU',
         type: 'local',
         joined: new Date(),
         active: true,
         settings: {
            theme: 'light',
            suggestions: 'youtube'
         }
      };
   },

   getUsers: function(n) {
      var users = [];
      for (var i = 0; i < n; ++i) {
         users.push(this.user());
      }

      return users;
   },

   link: function(category) {
      var link = {
         title: 'its g-noo',
         artist: 'richard stallman',
         other: 'interjection series',
         url: 'https://www.youtube.com/watch?v=9sJUDx7iEJw&unique=' + autoInc++
      };

      if (category) link.category = category;
      return link;
   },

   getLinks: function(n) {
      var links = [];

      for (var i = 0; i < n; ++i) {
         links.push(this.link());
      }

      return links;
   },

   randomLink: function(category) {
      var link = {
         title: crypto.randomBytes(30).toString('utf8'),
         artist: crypto.randomBytes(30).toString('utf8'),
         other: crypto.randomBytes(30).toString('utf8'),
         url: 'https://www.youtube.com/watch?v=' + crypto.randomBytes(5).toString('hex') + 'a'
      };

      if (category) link.category = category;
      return link;
   },

   init: function() {
      db.users.remove({}, function() {});
      db.playlists.remove({}, function() {});
      db.categories.remove({}, function() {});
      db.links.remove({}, function() {});
      db.transactions.remove({}, function() {});
   },

   newSession: function(user, agent, cb) {
      user.passConfirm = user.password;
      agent.post('/register')
      .type('form')
      .send(user)
      .end(function(err, res) {
         db.transactions.findOne({
            type: 'activate'
         }, function(err, transaction) {
            db.users.insert(transaction.user, function(err, newUser) {
               if (err) throw err;
               agent.post('/login')
               .type('form')
               .send(user)
               .end(function(err) {
                  process.nextTick(function() {
                     cb(err, newUser && newUser[0]);
                  });
               });
            });
         });
      });
   }
};
