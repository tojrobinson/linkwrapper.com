'use strict';

var bunyan = require('bunyan');
var config = require('r/config/settings');

function reqSerializer(req) {
   return {
      method: req.method,
      url: req.url,
      headers: req.headers
   }
};

function errSerializer(err) {
   return err.stack;
}

var log = bunyan.createLogger({
   name: 'linkwrapper',

   streams: [
      {
         level: 'error',
         path: config.logPath + 'linkwrapper.log'
      }
   ],

   serializers: {
      req: reqSerializer,
      err: errSerializer
   }
});

module.exports = log;
