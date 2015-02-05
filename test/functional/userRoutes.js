var request = require('supertest');
var app = require('r/server');
var db = require('r/app/util/db');
var data = require('r/test/data');
var test = require('tape');

app.on('ready', function() {
   var agent = request.agent(app);
   var user = data.user();
   var category;
   var playlist;
   var linkId;

   test('setup', function(t) {
      data.init(function() {
         data.newSession(user, agent, function(err) {
            t.error(err, 'creating session');
            t.end();
         });
      });
   });

   test('create lists', function(t) {
      t.plan(4);

      agent
         .post('/a/addList')
         .type('form')
         .send({list: {name: 'Stallman Talks', order: 0},  type: 'category'})
         .expect('Content-Type', 'application/json; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'adding category');
            category = res.body.data.id;
            t.ok(category, 'received category id');
         });

      agent
         .post('/a/addList')
         .type('form')
         .send({list: {name: 'FSF all day', order: 9},  type: 'playlist'})
         .expect('Content-Type', 'application/json; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'adding playlist');
            playlist = res.body.data.id;
            t.ok(playlist, 'received playlist id');
         });

   });

   test('invalid request body', function(t) {
      t.plan(2);

      // reset rate limiter
      setTimeout(function() {
         agent
            .post('/a/addList')
            .type('form')
            .send({list: {name: 'FSF all day', order: 9},  type: 'invalid'})
            .expect(422)
            .end(function(err, res) {
               t.error(err, 'send invalid list type');
            });

         agent
            .post('/a/addList')
            .type('form')
            .send({type: 'invalid'})
            .expect(422)
            .end(function(err, res) {
               t.error(err, 'omit list param');
         });
      }, 1000);
   });

   test('add to lists', function(t) {
      t.plan(12);
      agent
         .post('/a/addLink')
         .type('form')
         .send(data.randomLink(category))
         .expect('Content-Type', 'application/json; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'adding link to category');
            t.equal(res.body.type, 'success', 'received success response object');

            var link = res.body.data;
            linkId = link._id;
            t.ok(link, 'received link object in response');

            agent
               .post('/a/addToPlaylist')
               .type('form')
               .send({id: playlist, links: [link._id, link._id, link._id, link._id, link._id]})
               .expect('Content-Type', 'application/json; charset=utf-8')
               .expect(200)
               .end(function(err, res) {
                  t.error(err, 'adding links to playlist');
                  db.playlists.findOne({
                     _id: db.mongoId(playlist)
                  }, function(err, list) {
                     t.error(err, 'get playlist from db');
                     t.ok(list, 'received playlists from db');

                     var links = list.links;
                     t.equal(links.length, 5, 'playlist has 5 links in it');

                     for (var i = 0; i < 5; ++i) {
                        t.equal(links[i].order, i+1);
                     }
                  });
               });
         });
   });

   test('remove from playlist', function(t) {
      t.plan(9);

      agent
         .post('/a/removeFromPlaylist')
         .type('form')
         .send({id: playlist, positions: [1,3,5]})
         .expect('Content-Type', 'application/json; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'remove 3 links from playlist');
            t.equal(res.body.type, 'success', 'received success object');
            db.playlists.findOne({
               _id: db.mongoId(playlist)
            }, function(err, list) {
               t.error(err, 'get playlist from db');
               t.ok(list, 'received playlist')

               var links = list.links;
               t.equal(links.length, 2, 'find 2 links in list');

               for (var i = 0; i < 2; ++i) {
                  t.equal(links[i].order, i+1, 'links are ordered correctly');
               }
            });

            db.links.findOne({
               _id: db.mongoId(linkId)
            }, function(err, link) {
               t.error(err, 'check link still in db');
               t.ok(link, 'link still exists');
            });
         });
   });

   test('remove from category', function(t) {
      t.plan(4);

      agent
         .post('/a/deleteLinks')
         .type('form')
         .send({linkIds: [linkId]})
         .expect('Content-Type', 'application/json; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'remove link permanently');
            t.ok(res.body, 'received success object');

            db.links.findOne({
               _id: db.mongoId(linkId)
            }, function(err, link) {
               t.error(err, 'try to get link from db');
               t.equal(link, null, 'link no longer exists in db');
            });
         });
   });

   test('teardown', function(t) {
      t.end();
      process.exit(0);
   });
});
