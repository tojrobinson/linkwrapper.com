'use strict';

var c = require('r/app/controllers');
var m = require('r/app/util/middleware');

module.exports = function(app) {
   // main site
   app.get('/', m.activeUser, c.get.index);
   app.get('/register', m.activeUser, c.get.register);
   app.post('/register', m.activeUser, c.post.register);

   // auth
   app.get('/logout', c.get.logout);
   app.post('/login', m.activeUser, c.post.login);
   app.get('/login/:loginType', m.activeUser, c.get.processLogin);
   app.get('/verify/:loginType', m.activeUser, c.get.verifyLogin);
   app.get('/activate', m.activeUser, c.get.activateUser);

   // main view
   app.get('/player', m.restrict, c.get.player);

   // async
   app.post('/a/addLink', m.restrict, c.async.addLink);
   app.post('/a/addList', m.restrict, c.async.addList);
   app.post('/a/addToPlaylist', m.restrict, c.async.addToPlaylist);
   app.post('/a/removeFromPlaylist', m.restrict, c.async.removeFromPlaylist);
   app.post('/a/addPlay', m.restrict, c.async.addPlay);
   app.post('/a/editLink', m.restrict, c.async.editLink);
   app.get('/a/category', m.restrict, c.async.category);
   app.get('/a/playlist', m.restrict, c.async.playlist);
   app.post('/a/deleteLists', m.restrict, c.async.deleteLists);
   app.post('/a/editLists', m.restrict, c.async.editLists);
   app.get('/a/getUser', m.restrict, c.async.getUser);
   app.get('/a/getUserLists', m.restrict, c.async.getUserLists);
   app.post('/a/deleteLinks', m.restrict, c.async.deleteLinks);
   app.post('/a/extract', m.restrict, c.async.extract);
   app.post('/a/editUser', m.restrict, c.async.editUser);
}
