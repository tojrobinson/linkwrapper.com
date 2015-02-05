var request = require('supertest');
var app = require('r/server');
var db = require('r/app/util/db');
var data = require('r/test/data');
var test = require('tape');

app.on('ready', function() {
   var agent = request.agent(app);
   var user = data.user();
   var passHash;
   var category;
   var playlist;
   var linkId;
   var transactionId;

   test('setup', function(t) {
      data.init(function() {
         data.newSession(user, agent, function(err) {
            t.error(err, 'creating session');
            t.end();
         });
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
            t.ok(res.body.msg.indexOf('Some details were invalid or') >= 0, 'return dialogue 137');
         });
   });

   test('edit password errors', function(t) {
      t.plan(9);
      agent
         .post('/a/editUser')
         .type('form')
         .send({
            editPass: {
               password: 'test',
               passConfirm: 'test',
               password: user.password + 'wrong'
            }
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'try to edit password with invalid');

            var data = res.body;
            t.equal(data.type, 'error', 'received error type');
            t.ok(data.msg, 'received message');
         });
         
      agent
         .post('/a/editUser')
         .type('form')
         .send({
            editPass: {
               password: 'test',
               passConfirm: 'testmistake',
               password: user.password
            }
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'try to edit password with invalid');

            var data = res.body;
            t.equal(data.type, 'error', 'received error type');
            t.ok(data.msg, 'received message');
         });

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            editPass: {
               password: '',
               passConfirm: '',
               password: user.password
            }
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'try to edit password with invalid');

            var data = res.body;
            t.equal(data.type, 'error', 'received error type');
            t.ok(data.msg, 'received message');
         });
   });

   test('edit password success', function(t) {
      t.plan(5);

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            editPass: {
               password: 'newPass',
               passConfirm: 'newPass',
               currPassword: user.password
            }
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'try to edit password with valid');

            var data = res.body;
            t.equal(data.type, 'success', 'received error type');
            t.ok(!data.msg, 'did not received message');

            db.users.findOne({
               email: user.email,
               type: user.type
            }, function(err, user) {
               t.error(err, 'find user after password updated');
               t.ok(passHash !== user.password, 'password has been updated');
            });
         });
   });

   test('edit email', function(t) {
      t.plan(14);

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
               passHash = user.password;
               t.error(err, 'find updated user in db');
               t.equal(userInfo.email, user.email, 'email is currently unchanged');
            });

            db.transactions.findOne({
               type: 'confirmEmail'
            }, function(err, transaction) {
               t.error(err, 'find transaction');
               t.equal(transaction.from, user.email, 'old email saved correctly to transaction');
               t.equal(transaction.to, 'valid@email.com', 'new email saved correctly to transaction');
               transactionId = transaction._id;
            });
         });
   });

   test('confirm email', function(t) {
      t.plan(5);

      agent
      .get('/confirm/' + transactionId)
      .expect(200)
      .end(function(err, res) {
         t.error(err, 'confirm valid email');
         t.ok(res.text.indexOf('successfully updated') >= 0, 'displayed success message');

         db.users.findOne({
            email: 'valid@email.com'
         }, function(err, updatedUser) {
            t.error(err, 'find user in db');
            t.ok(updatedUser, 'user email was successfully updated');
            db.transactions.remove({}, function(err) {
               t.error(err, 'clear transactions');
            });
         });
      });
   });

   test('resend new email', function(t) {
      t.plan(8);

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
            email: 'newValid@email.com'
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send new valid email');

            t.equal(res.body.type, 'success', 'returned success response');
            t.ok(res.body.msg.indexOf('confirmation email') >= 0, 'displayed confirmation message (dialogue 30)');

            db.transactions.findOne({
               type: 'confirmEmail'
            }, function(err, transaction) {
               t.error(err, 'find transaction in db');
               t.equal(transaction.to, 'newvalid@email.com', 'to email field updated lowercase');
            });
         });
   });

   test('update user', function(t) {
      db.users.update({}, {
         $set: {
            email: 'newvalid@email.com'
         }
      }, function(err) {
         t.error(err, 'set lowercase nevalid@email.com');
         t.end();
      });
   });

   test('case sensitivity', function(t) {
      t.plan(3);

      agent
         .post('/a/editUser')
         .type('form')
         .send({
            email: 'NewVALID@eMail.com'
         })
         .expect(200)
         .expect('Content-Type', 'application/json; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'send alternate case email');

            t.equal(res.body.type, 'success', 'returned success response');
            t.notOk(res.body.msg, 'no email confirmation sent for case insensitive variation');
         });
   });

   test('set user email', function(t) {
      db.users.update({}, {
         $set: {email: user.email}
      }, function(err) {
         t.error(err, 'set user email');
         t.end();
      });
   });

   test('white space', function(t) {
      t.plan(3);

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
