'use strict';

var c = require('r/app/controllers');
var m = require('r/app/util/middleware');

module.exports = function(app) {
   app.post('/recover', m.rateLimit);
   app.post('/guest', m.rateLimit);
   app.post('/login', m.rateLimit);

   // welcome
   app.get('/', m.activeUser, c.get.index);
   app.get('/login', m.activeUser, c.get.login);
   app.get('/register', m.activeUser, c.get.register);
   app.post('/register', m.activeUser, c.post.register);
   app.get('/recover', m.activeUser, c.get.recoverAccount);
   app.post('/recover', m.activeUser, c.post.recoverAccount);

   app.post('/guest', m.activeUser, c.post.guest);

   // transactions
   app.get('/resetPassword/:id', m.activeUser, c.get.resetPassword);
   app.post('/resetPassword', m.activeUser, c.post.resetPassword);
   app.get('/activate/:id', c.get.activateUser);
   app.get('/confirm/:id', c.get.confirmEmail);

   // auth
   app.get('/logout', c.get.logout);
   app.post('/login', m.activeUser, c.post.login);
   app.get('/login/:loginType', m.activeUser, c.get.processLogin);
   app.get('/verify/:loginType', m.activeUser, c.get.verifyLogin);

   // main view
   app.get('/player', m.restrict, c.get.player);

   // async
   app.all('/a/*', m.restrict);
   app.all('/a/*', m.rateLimit);

   app.post('/a/addLink', c.async.addLink);
   app.post('/a/addList', c.async.addList);
   app.post('/a/addToPlaylist', c.async.addToPlaylist);
   app.post('/a/removeFromPlaylist', c.async.removeFromPlaylist);
   app.post('/a/addPlay', c.async.addPlay);
   app.post('/a/editLink', c.async.editLink);
   app.get('/a/category', c.async.category);
   app.get('/a/playlist', c.async.playlist);
   app.post('/a/deleteLists', c.async.deleteLists);
   app.post('/a/editLists', c.async.editLists);
   app.post('/a/syncPlaylist', c.async.syncPlaylist);
   app.get('/a/getUser', c.async.getUser);
   app.get('/a/getUserLists', c.async.getUserLists);
   app.post('/a/deleteLinks', c.async.deleteLinks);
   app.post('/a/addManyLinks', c.async.addManyLinks);
   app.post('/a/editUser', m.restrict, c.async.editUser);
}
