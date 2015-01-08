'use strict';

var redis = require('redis');
var client = redis.createClient();

client.on('error', function(err) {
   console.error('[redis] ' + err);
});

module.exports = client;
