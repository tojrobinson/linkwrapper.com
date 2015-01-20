var request = require('supertest');
var app = require('r/server');
var db = require('r/app/util/db');
var data = require('r/test/data');
var test = require('tape');

app.on('ready', function() {
   var agent = request.agent(app);
   var transactionId = null;
   var newUser = data.user();
   
   test('setup', function(t) {
      db.users.remove({
         email: newUser.email,
         type: 'local'
      }, function(err) {
         t.error(err);
         t.end();
      });
   });

   test('register user', function(t) {
      t.plan(4);

      newUser.passConfirm = newUser.password;
      agent
         .post('/register')
         .type('form')
         .send(newUser)
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'register user');
            db.transactions.findOne({
               type: 'activate'
            }, function(err, transaction) {
               t.error(err, 'find transaction');
               t.ok(transaction, 'transaction was created');
               t.equal(transaction.user.email, newUser.email, 'user object is stored in transaction');
               transactionId = transaction._id;
            });
         });
   });

   test('activate user', function(t) {
      t.plan(4);

      agent
         .get('/activate/' + transactionId)
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'activate user');
            t.ok(res.text.indexOf('Your account is now active.') > -1, 'active account message displayed');
            
            db.users.findOne({
               email: newUser.email,
               type: 'local'
            }, function(err, user) {
               t.error(err, 'check user is active');
               t.ok(user, 'user inserted into users collection');
            });
         });
   });

   test('teardown', function(t) {
      t.end();
      process.exit(0);
   });
});
