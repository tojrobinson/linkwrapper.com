'use strict';

var config = require('r/config/settings');
var nodemailer = require('nodemailer');
var mail = nodemailer.createTransport('SMTP', config.mailService);

module.exports = {
   validEmail: function(email) {
      return typeof email === 'string' && email.match(/.*@.*\..*/);
   },

   sendMail: function(opt, cb) {
      console.log(opt);
      if (!config.mailServer) {
         console.log('Mail server details unset.');
         cb(false);
      } else {
         mail.sendMail(opt, cb);
      }
   }
};
