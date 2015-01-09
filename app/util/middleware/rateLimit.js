'use strict';

var redis = require('r/app/util/redis');
var RedisLimiter = require('redis-limiter');
var limiter = new RedisLimiter({prefix: 'lim', client: redis});

limiter.add('/a/category', {
   interval: 1,
   limit: 2
});

limiter.add('/a/playlist', {
   interval: 1,
   limit: 2
});

limiter.add('/a/deleteLinks', {
   interval: 1,
   limit: 2
});

limiter.add('/a/addList', {
   interval: 1,
   limit: 2
});

module.exports = function(req, res, next) {
   limiter.limit(req.path, req.ip, function(err, result) {
      if (err || !result) {
         return next();
      }

      if (result.exceeded) {
         return res.sendStatus(429);
      }

      next();
   });
}
