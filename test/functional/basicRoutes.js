var request = require('supertest');
var app = require('r/server');
var db = require('r/app/util/db');
var obj = require('r/test/obj');
var test = require('tape');

app.on('ready', function() {
   var agent = request.agent(app);
   var newUser = obj.user();
   
   test('setup', function(t) {
      obj.init();
      t.end();
   });

   test('non session routes', function(t) {
      t.plan(3);

      agent
         .get('/')
         .expect('Content-Type', 'text/html; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'GET /');
         });

      agent
         .get('/register')
         .expect('Content-Type', 'text/html; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'GET /register');
         });

      agent
         .get('/player')
         .expect('Content-Type', 'text/plain; charset=utf-8')
         .expect(302)
         .end(function(err, res) {
            t.error(err, 'GET /player (no session)');
         });
   });

   test('register', function(t) {
      t.plan(6);

      var errUser = obj.user();
      newUser.passConfirm = newUser.password;
      errUser.passConfirm = newUser.password + 'different';

      agent
         .post('/register')
         .type('form')
         .send(errUser)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'POST /register (invalid)');
            t.ok(res.text.indexOf('Passwords are required and must match.') > -1, 'password mismatch');
         });

      agent
         .post('/register')
         .type('form')
         .send(newUser)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'POST /register (valid)');
            t.ok(res.text.indexOf('A confirmation email has been sent') > -1, 'Registered successfully');

            // activate
            db.users.findOne({
               email: newUser.email,
               type: 'local' 
            }, function(err, user) {
               t.error(err);
               user.active = true;
               newUser._id = user._id;
               db.users.save(user, function(err) {
                  t.error(err);
               });
            });
         });

   });

   test('register existing', function(t) {
      t.plan(2);

      agent
         .post('/register')
         .type('form')
         .send(newUser)
         .expect(200)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'POST /register (email exists)');
            t.ok(res.text.indexOf('An account already exists') > -1, 'account exists');
         });
   });

   test('invalid login', function(t) {
      t.plan(4);
      agent
         .post('/login')
         .type('form')
         .send({email: newUser.email, password: newUser.password + 'wrong'})
         .expect(200)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'POST /login (invalid)');
            t.ok(res.text.indexOf('Invalid email or password.') > -1, 'invalid email or password');
         });

      agent
         .post('/login')
         .type('form')
         .send({email: newUser.email + 'wrong', password: newUser.password})
         .expect(200)
         .expect('Content-Type', 'text/html; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'POST /login (invalid)');
            t.ok(res.text.indexOf('Invalid email or password.') > -1, 'invalid email or password');
         });
   });

   test('valid login', function(t) {
      t.plan(1);
      agent
         .post('/login')
         .type('form')
         .send({email: newUser.email, password: newUser.password})
         .expect(302)
         .expect('Content-Type', 'text/plain; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'POST /login (valid)');
         });
   });

   test('get player', function(t) {
      t.plan(2);

      agent 
         .get('/player')
         .expect(200)
         .end(function(err, res) {
            t.error(err, 'GET /player (with session)');
          });

     agent
         .get('/')
         .expect('Content-Type', 'text/plain; charset=utf-8')
         .expect(302)
         .end(function(err, res) {
            t.error(err, 'GET / (with session)');
         });
   });

   test('end session', function(t) {
      t.plan(3);
      agent
         .get('/logout')
         .expect(302)
         .expect('Content-Type', 'text/plain; charset=utf-8')
         .end(function(err, res) {
            t.error(err, 'GET /logout (with session)');

            agent
               .get('/player')
               .expect(302)
               .expect('Content-Type', 'text/plain; charset=utf-8')
               .end(function(err, res) {
                  t.error(err, 'cannot load /player without session');
               });

            agent
               .post('/a/editUser')
               .type('form')
               .send({json: JSON.stringify({display: 'valid', email: 'valid@email.com'})})
               .expect(401)
               .end(function(err, res) {
                  t.error(err, 'try to edit user without session');
               });
         });
   });

   test('teardown', function(t) {
      t.end();
      process.exit(0);
   });
});
