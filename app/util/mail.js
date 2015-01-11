'use strict';

var config = require('r/config/settings');
var Mailgun = require('mailgun-js');
var render = require('r/app/views/mail');
var debug = config.debug || process.env.NODE_ENV !== 'production';

module.exports = {
   validEmail: function(email) {
      return typeof email === 'string' && email.match(/[^\s]+@[^\s]+\.[^\s]+/);
   },

   // TODO ensure body has content
   send: function(data, cb) {
      var mg = new Mailgun(config.mailgun);
      data.from = data.from || config.mail.default + config.domain;

      if (!data.tmpl) {
         if (debug) {
            return process.nextTick(function() {
               console.log(data);
               cb(null, null);
            });
         }

         return mg.messages().send(data, cb);
      }

      render(data.tmpl.name, data.tmpl.ctx, function(err, html) {
         delete data.tmpl;
         data.html = html;
         if (debug) {
            return process.nextTick(function() {
               console.log(data);
               cb(null, null);
            });
         }

         mg.messages().send(data, cb);
      });
   }
};
