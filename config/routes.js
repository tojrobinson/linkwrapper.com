'use strict';

var c = require('r/app/controllers');
var m = require('r/app/util/middleware');

module.exports = function(app) {
   // welcome
   app.get('/', m.activeUser, c.get.index);
   app.get('/register', m.activeUser, c.get.register);
   app.post('/register', m.activeUser, c.post.register);
   app.get('/guest', m.activeUser, c.post.guest);

   // auth
   app.get('/logout', c.get.logout);
   app.post('/login', m.activeUser, c.post.login);
   app.get('/login/:loginType', m.activeUser, c.get.processLogin);
   app.get('/verify/:loginType', m.activeUser, c.get.verifyLogin);
   app.get('/activate', c.get.activateUser);
   app.get('/confirm', c.get.confirmEmail);
   app.get('/recover', m.activeUser, c.get.recover);
   app.post('/recover', m.activeUser, c.post.recover);

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
