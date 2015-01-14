'use strict';

// js for login / documentation pages
var Captcha = require('./player/util/captcha');
var util = require('./player/util/');
var cover = $('<div class="view-cover">');

$(document).ready(function() {
   $('#guest').click(function() {
      $('body')
      .append(cover)
      .append($('#guest-modal').html());

      new Captcha('captcha');

      $('.modal').animate({
         opacity: 1,
         top: '20%'
      }, 400);
   });

   $('body').on('click', '.close-modal', function() {
      cover.remove();
      $('.modal').remove();
   });

   $('body').on('submit', '.modal', function(e) {
      var form = $('#guest-form');
      var obj = util.serialize(form);

      $('.modal-submit').val('Processing...');

      if (!obj['g-recaptcha-response']) {
         form
         .find('.error-message')
         .text('Please confirm that you are not a robot.');

         $('.modal-submit').val('Continue');
         return false;
      }
      return true;
   });
});
