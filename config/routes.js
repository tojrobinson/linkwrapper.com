'use strict';

var c = require('r/app/controllers');
var m = require('r/app/util/middleware');

module.exports = function(app) {
   // main site
   app.get('/', c.get.index);
   app.get('/register', m.activeUser, c.get.register);
   app.post('/register', m.activeUser,  c.post.register);

   /////////
   // auth
   app.get('/login', m.activeUser, c.get.login);
   app.get('/logout', c.get.logout);
   app.post('/login', m.activeUser, c.post.login);
   app.get('/login/:loginType', m.activeUser, c.get.processLogin);
   app.get('/verify/:loginType', m.activeUser, c.get.verifyLogin);
   app.get('/activate', m.activeUser, c.get.activateUser);

   // main view
   app.get('/player', m.restrict, c.get.player);
   // app.get('/upload', m.restrict, c.get.upload);
   // app.post('/upload', m.restrict, c.post.upload);

   /////////
   // async
   app.post('/a/addLink', m.restrict, c.async.addLink);
   app.post('/a/playcount', m.restrict, c.async.playCount);
   app.post('/a/editLink', m.restrict, c.async.editLink);
   app.get('/a/category', m.restrict, c.async.category);
   app.get('/a/playlist', m.restrict, c.async.playlist);
   app.get('/a/createList', m.restrict, c.async.createList);
   app.get('/a/removeList', m.restrict, c.async.removeList);
   app.get('/a/getUser', m.restrict, c.async.getUser);
   app.post('/a/removeAllLinks', m.restrict, c.async.removeAllLinks);
   app.post('/a/extract', m.restrict, c.async.extract);
   app.post('/a/editUser', m.restrict, c.async.editUser);
}
