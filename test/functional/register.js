var request = require('supertest');
var app = require('r/server');
var db = require('r/app/util/db');
var obj = require('r/test/obj');
var test = require('tape');

app.on('ready', function() {
   var agent = request.agent(app);
   var token = null;
   var newUser = obj.user();
   
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
      t.plan(5);

      newUser.passConfirm = newUser.password;
      agent
         .post('/register')
         .type('form')
         .send(newUser)
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'register user');
            db.users.findOne({
               email: newUser.email,
               type: 'local'
            }, function(err, user) {
               console.log(err);
               t.error(err, 'find user in db');
               t.ok(user, 'user exists');
               t.equal(user.active, false, 'user is not active');
               t.ok(typeof user.token === 'string', 'token for activation exists');
               token = user.token;
            });
         });
   });

   test('activate user', function(t) {
      t.plan(6);

      agent
         .get('/activate?s=' + token + '&u=' + newUser.email)
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'activate user');
            t.ok(res.text.indexOf('Your account is now active.') > -1);
            
            db.users.findOne({
               email: newUser.email,
               type: 'local'
            }, function(err, user) {
               t.error(err, 'check user is active');
               t.ok(user, 'user still exists');
               t.notOk(user.token, 'token has been removed');
               t.equal(user.active, true, 'user is now active');
            });
         });
   });

   test('teardown', function(t) {
      t.end();
      process.exit(0);
   });
});
