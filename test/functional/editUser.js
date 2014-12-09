var request = require('supertest');
var app = require('r/server');
var db = require('r/app/util/db');
var obj = require('r/test/obj');
var test = require('tape');

app.on('ready', function() {
   var agent = request.agent(app);
   var user = obj.user();
   var category;
   var playlist;
   var linkId;

   test('setup', function(t) {
      obj.newSession(user, agent, function(err) {
         t.error(err, 'creating session');
         t.end();
      });
   });

   test('edit display', function(t) {
      t.plan(7);
      agent
         .post('/a/ediTUser')
         .type('form')
         .send({
            display: 'test'
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'update user display');

            var data = res.body.data;
            t.ok(data, 'returned data object');
            t.equal(data.display, 'test', 'returned new display');
            t.equal(data.email, user.email, 'email was not changed');
         });

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            display: 'this display is too long'
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'sending invalid display');

            t.ok(res.body.msg, 'returned msg');
            t.equal(res.body.msg, 'Invalid details.', 'return dialogue 137');
         });
   });

   test('edit email', function(t) {
      t.plan(11);

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            email: user.email
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send current email');

            var data = res.body.data;
            t.ok(data, 'returned data object');
            t.notOk(res.body.msg, 'did not return msg');
         });

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            email: 'invalid@email'
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send invalid email');

            t.equal(res.body.type, 'error', 'returned error response');
            t.equal(res.body.msg, 'Invalid email address.', 'returned invalid dialogue 136.');
         });

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            email: 'valid@email.com'
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send valid email');

            t.equal(res.body.type, 'success', 'returned success response');
            t.ok(res.body.msg.indexOf('confirmation email') >= 0, 'displayed confirmation message (dialogue 30)');

            db.users.findOne({
               type: user.type,
               email: user.email
            }, function(err, userInfo) {
               t.error(err, 'find updated user in db');
               t.ok(userInfo.newEmail, 'user now has newUser field');
            });
         });
   });

   test('edit email special cases', function(t) {
      t.plan(12);

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            email: 'valid@email.com'
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send valid email');
            t.equal(res.body.type, 'success', 'returned success response');
            t.notOk(res.body.msg, 'did not display confirmation email (dialogue 30)');
         });

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            email: user.email
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send previous/current email');
            t.equal(res.body.type, 'success', 'returned success response');
            t.notOk(res.body.msg, 'did not display confirmation email (dialogue 30)');
         });
      
      agent
         .post('/a/editUser')
         .type('form')
         .send({
            email: 'newValid@email.com'
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send new valid email');

            t.equal(res.body.type, 'success', 'returned success response');
            t.ok(res.body.msg.indexOf('confirmation email') >= 0, 'displayed confirmation message (dialogue 30)');

            db.users.findOne({
               type: user.type,
               email: user.email
            }, function(err, userInfo) {
               t.error(err, 'find updated user in db');
               t.equal(userInfo.newEmail === 'newValid@email.com', 'newEmail field updated');
            });
         });

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            email: '     ' + user.email + '     '
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send white space');

            t.equal(res.body.type, 'success', 'returned success response');
            t.notOk(res.body.msg, 'did not display confirmation email (dialogue 30)');
         });
   });

   test('teardown', function(t) {
      t.end();
      process.exit(0);
   });
});
