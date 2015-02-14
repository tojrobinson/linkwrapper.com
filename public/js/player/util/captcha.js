'use strict';

var SITE_KEY = '6LfsWgATAAAAAP2GMgIeNysO884W3evlUxxU6Q00';
var SRC = 'https://www.google.com/recaptcha/api.js?onload=captchaReady&render=explicit';
var requested = false;

module.exports = Captcha;

function Captcha(target) {
   this.target = target;

   if (!requested) {
      load(target);
   } else if (window.grecaptcha) {
      $('#' + target).html('');
      window.grecaptcha.render(target, {
         sitekey: SITE_KEY
      });
   }
}

function load(target) {
   var api = $('<script>')[0];

   window.captchaReady = function() {
      $('#' + target).html('');
      window.grecaptcha.render(target, {
         sitekey: SITE_KEY
      });
   }

   api.src = SRC;
   $('body').append(api);
   requested = true;
}

Captcha.prototype.reload = function() {
   if (!window.grecaptcha) {
      $('#' + this.target).text('');
      load(this.target);
   } else {
      window.grecaptcha.reset();
   }
}

Captcha.prototype.getResponse = function() {
   return window.grecaptcha.getResponse();
}
