'use strict';

var https = require('https');
var config = require('r/config/settings');

module.exports = function(userString, cb) {
   var req = https.request({
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify?secret=' + config.recaptchaKey + '&response=' + userString,
      method: 'GET'
   }, function(res) {
      var data = [];
      res.setEncoding('utf8');

      res.on('data', function (chunk) {
         data.push(chunk);
      });

      res.on('end', function() {
         try {
            var result = JSON.parse(data.join(''));
            cb(null, result.success);
         } catch(e) {
            cb(new Error('Invalid response'));
         }
      });
   });

   req.on('error', function(e) {

   });

   req.end();
}
