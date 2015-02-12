'use strict';

var redis = require('r/app/util/redis');
var d = require('r/app/views/dialogues');
var RedisLimiter = require('redis-limiter');
var limiter = new RedisLimiter({prefix: 'lim', client: redis});

limiter.add('/a/category', {
   interval: 2,
   limit: 4
});

limiter.add('/a/playlist', {
   interval: 2,
   limit: 4
});

limiter.add('/a/deleteLinks', {
   interval: 1,
   limit: 2
});

limiter.add('/a/addList', {
   interval: 1,
   limit: 3
});

limiter.add('/guest', {
   interval: 10,
   limit: 1
});

module.exports = function(req, res, next) {
   limiter.limit(req.path, req.ip, function(err, result) {
      if (err || !result) {
         return next();
      }

      if (result.exceeded) {
         res.status(429);

         if (req.user) {
            return res.json(d.pack({code: 102}));
         }

         return res.render('error', d.pack({code: 102}));
      }

      next();
   });
}
