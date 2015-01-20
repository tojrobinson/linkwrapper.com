var request = require('supertest');
var app = require('r/server');
var db = require('r/app/util/db');
var data = require('r/test/data');
var test = require('tape');

app.on('ready', function() {
   var agent = request.agent(app);
   var user = data.user();
   var transactionId;
   
   test('setup', function(t) {
      data.init();
      data.newSession(user, agent, function(err, newUser) {
         user._id = newUser && newUser._id;

         agent
            .get('/logout')
            .expect(302)
            .expect('Content-Type', 'text/plain; charset=utf-8')
            .end(function(err, res) {
               t.error(err, 'creating user');
               t.end();
            });
      });
   });

   test('send invalid', function(t) {
      t.plan(4);

      agent
         .post('/recover')
         .send({
            email: 'invalid email'
         })
         .expect(200)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'POST /recover (invalid)');
            t.ok(res.text.indexOf('Invalid email') >= 0, 'invalid email error message displayed');
         });

      agent
         .post('/recover')
         .send({
            email: 'valid@email.com'
         })
         .expect(200)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'POST /recover (invalid)');
            t.ok(res.text.indexOf('No account') >= 0, 'no account found error message displayed');
         });
   });

   test('send valid', function(t) {
      t.plan(4);

      agent
         .post('/recover')
         .send({
            email: user.email
         })
         .expect(200)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'POST /recover (invalid)');
            t.ok(res.text.indexOf('Instructions on') >= 0, 'instructions notification displayed');

            db.transactions.findOne({
               user: user._id
            }, function(err, transaction) {
               t.error(err, 'find transaction in db');
               t.ok(transaction, 'user field is correctly set');
               transactionId = transaction._id;
            });
         });
   });


   test('reset password', function(t) {
      t.plan(6);

      agent
         .get('/resetPassword/' + transactionId)
         .send({
            email: user.email
         })
         .expect(200)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'follow reset password link');
            t.ok(res.text.indexOf('Reset Password') >= 0, 'reset password page displayed');
         });

      agent
      .post('/resetPassword')
      .send({
         password: 'new',
         passConfirm: 'diff',
         t: transactionId
      })
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(function(err, res) {
         t.error(err, 'reset password (invalid details)');
         t.ok(res.text.indexOf('Reset Password') >= 0, 'reset password page displayed');
      });

      agent
      .post('/resetPassword')
      .send({
         password: 'new',
         passConfirm: 'new',
         t: transactionId
      })
      .expect(200)
      .expect('Content-Type', 'text/html; charset=utf-8')
      .end(function(err, res) {
         t.error(err, 'reset password (valid details)');
         t.ok(res.text.indexOf('Your password has') >= 0, 'password reset success message displayed');
      });
   });

   test('teardown', function(t) {
      t.end();
      process.exit(0);
   });
});
