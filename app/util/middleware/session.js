'use strict';

var config = require('r/config/settings');
var redis = require('r/app/util/redis');
var Cookies = require('cookies');
var uuid = require('node-uuid');

var GUEST_MINUTES = config.guestMinutes || 60;

module.exports = function(opt) {
   return function(req, res, next) {
      var cookies = new Cookies(req, res, [opt.secret]);
      var sid = cookies.get('lws', {signed: true});
      var prefix = 'sess:';
      var ttl = 60 * 60 * 12;

      function newSession() {
         var id = uuid.v4();

         cookies.set('lws', id, {
            signed: true,
            httpOnly: true
         });

         return id;
      }

      function destroySession() {
         redis.del(prefix + sid, function(err) {
            if (err) {
               console.error(err);
            }

            req.session = null;
         });
      }

      req.session = {};
      req._destroySession = destroySession;

      if (!sid) {
         sid = newSession();
         return next();
      }

      redis.get(prefix + sid, function(err, session) {
         if (err) {
            return next();
         }

         if (session) {
            try {
               req.session = JSON.parse(session);
            } catch(e) {
               console.error(e);
            }

            return next();
         }

         var _end = res.end;

         res.end = function() {
            var args = arguments;

            // if authenticated
            if (req.user) {
               var obj;

               if (req.user.type === 'guest') {
                  ttl = 60 * GUEST_MINUTES;
               }

               // gen new session to limit session hijacking
               sid = newSession();

               try {
                  obj = JSON.stringify(req.session);
                  redis.setex(prefix + sid, ttl, obj, function(err) {
                     if (err) {
                        console.error(err);
                     }

                     _end.apply(res, args);
                  });
               } catch (e) {
                  console.error(e);
               }
            }

            _end.apply(res, args);
         }

         next();
      });
   }
}
