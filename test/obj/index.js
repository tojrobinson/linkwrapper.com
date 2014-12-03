'use strict';

var db = require('r/app/util/db');
var path = require('path');
var crypto = require('crypto');

module.exports = {
   bookmarks: path.join(__dirname, 'bookmarks.html'),
   user: function() {
      return {
         display: 'RMS',
         email: 'richard.stallman@linkwrapper.com',
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

   link: function(category) {
      var link = {
         title: 'its g-noo',
         artist: 'richard stallman',
         other: 'interjection series',
         url: 'https://www.youtube.com/watch?v=9sJUDx7iEJw'
      };

      if (category) link.category = category;
      return link;
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

   newSession: function(user, agent, cb) {
      user.passConfirm = user.password;


      db.users.remove({}, function() {});
      db.playlists.remove({}, function() {});
      db.categories.remove({}, function() {});
      db.links.remove({}, function() {});

      agent
         .post('/register')
         .type('form')
         .send(user)
         .expect(200)
         .end(function(err, res) {
            db.users.update({
               email: user.email,
               type: user.type
            }, {
               $set: {active: true}
            }, function(err) {
               agent.post('/login')
               .type('form')
               .send(user)
               .end(function(err) {
                  if (err) cb(err);
                  else cb(null);
               });
            });
         });
   }
};
