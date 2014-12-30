var request = require('supertest');
var app = require('r/server');
var db = require('r/app/util/db');
var obj = require('r/test/obj');
var test = require('tape');

app.on('ready', function() {
   var agent = request.agent(app);
   var user = obj.user();
   var category;
   var CATEGORY_MAX = 500;

   test('setup', function(t) {
      obj.init();
      obj.newSession(user, agent, function(err) {
         t.error(err, 'creating session');

         agent
         .post('/a/addList')
         .type('form')
         .send({list: {name: 'Stallman Talks', order: 0},  type: 'category'})
         .expect('Content-Type', 'application/json; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'adding category');
            category = res.body.data.id;
            t.end();
         });
      });
   });

   test('add links individually', function(t) {
      t.plan(14);

      var newLink = obj.link(category);
      var errLink = obj.link(category);
      errLink.url = 'http://unsupported.com/v=3223423423';

      agent
         .post('/a/addLink')
         .type('form')
         .send(errLink)
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err);
            t.ok(res.body, 'received response object');
            t.ok(res.body.type === 'error', 'received error response');
         });

      agent
         .post('/a/addLink')
         .type('form')
         .send(newLink)
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'add valid link');
            var data = res.body.data;
            t.ok(res.body, 'received response object');
            t.equal(res.body.type, 'success', 'received success response');
            t.ok(data, 'data object returned');
            t.ok(data.url === newLink.url, 'data contains inserted object');
         });

      agent
         .post('/a/addLink')
         .type('form')
         .send(newLink)
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'adding same link');
            var data = res.body.data;
            t.ok(res.body, 'received response object');
            t.ok(res.body.type === 'error', 'received error response');
            t.ok(data, 'data is returned');
            t.ok(data.category, 'data contains category name');
            t.ok(res.body.msg.indexOf('Link already exists') >= 0, 'existing link message sent');
         });

   });

   test('add links in bulk', function(t) {
      t.plan(8);

      agent
         .post('/a/addManyLinks')
         .send({
            category: category,
            links: obj.getLinks(10)
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'insert 10 links');

            var data = res.body.data;
            t.equal(res.body.type, 'success', 'received success response');
            t.equal(data.valid, 10, 'found 10 valid links');
            t.equal(data.inserted, 10, 'inserted 10 links');
         });

      agent
         .post('/a/addManyLinks')
         .send({
            category: category,
            links: obj.getLinks(100)
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'insert 100 links');

            var data = res.body.data;
            t.equal(res.body.type, 'success', 'received success response');
            t.equal(data.valid, 100, 'found 100 valid links');
            t.equal(data.inserted, 100, 'inserted 100 links');
         });
   });

   test('fill category', function(t) {
      t.plan(6);
      agent
         .post('/a/addManyLinks')
         .send({
            category: category,
            links: obj.getLinks(1000)
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'fill remaining category with 1000 links');

            var data = res.body.data;
            t.equal(res.body.type, 'error', 'received error response');
            db.links.find({
               category: db.mongoId(category),
               pending: {$exists: false}
            }).count(function(err, available) {
               t.error(err, 'get non pending links');

               t.ok(available <= CATEGORY_MAX, 'unable to retrieve more than cmax');
               // allow write to finish
               setTimeout(function() {
                  db.links.find({
                     category: db.mongoId(category)
                  }).count(function(err, total) {
                     t.error(err, 'get all links from category');
                     t.equal(total, CATEGORY_MAX, 'category is at maximum capacity');
                  });
               }, 1000);
            });
         });
   });

   test('try to add links to removed category', function(t) {
      t.plan(5);
      var link = obj.randomLink();
      link.category = category;

      db.categories.remove({_id: db.mongoId(category)}, function(err) {
         t.error(err, 'remove category');

         agent
         .post('/a/addLink')
         .type('form')
         .send(link)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'adding same link');

            t.ok(res.body, 'received response object');
            t.ok(res.body.type, 'received error response');
            t.equal(res.body.msg, 'Collection no longer exists.');
         });
      });
   });

   test('teardown', function(t) {
      t.end();
      process.exit(0);
   });
});
