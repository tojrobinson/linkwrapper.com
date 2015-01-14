(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/tully/www/linkwrapper.com/node_modules/link-id/index.js":[function(require,module,exports){
'use strict';

module.exports = function(url) {
   var match = null;
   var info = null;

   // patterns
   var youTube = /youtu.*(?:(?:\.be|v|embed)\/|watch\?.*v=)([^#&?]*).*/i;
   var vimeo = /vimeo.com.*\/(\d+)/i;
   var soundCloud = /soundcloud.com\/([^?]+)/i;

   if (match = youTube.exec(url)) {
      info = {
         id: match[1],
         type: 'youtube'
      };
   } else if (match = vimeo.exec(url)) {
      info = {
         id: match[1],
         type: 'vimeo'
      };
   } else if (match = soundCloud.exec(url)) {
      info = {
         id: match[1],
         type: 'soundcloud'
      };
   }

   return info;
}

},{}],"/home/tully/www/linkwrapper.com/public/js/index.js":[function(require,module,exports){
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

},{"./player/util/":"/home/tully/www/linkwrapper.com/public/js/player/util/index.js","./player/util/captcha":"/home/tully/www/linkwrapper.com/public/js/player/util/captcha.js"}],"/home/tully/www/linkwrapper.com/public/js/player/util/captcha.js":[function(require,module,exports){
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
   var mount = $('script').first().parent();

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

},{}],"/home/tully/www/linkwrapper.com/public/js/player/util/extractor.js":[function(require,module,exports){
'use strict';

var parseLink = require('link-id');

function getInfo(title) {
   var parts = title.replace(/(?:^\W+|-\s*YouTube\s*$)/gi, '').split('-');
   if (parts.length > 1) {
      return {
         artist: parts[0].trim(),
            title: parts.slice(1).join('-').trim()
      };
   } else {
      return {
         artist: '',
            title: parts[0]
      };
   }
}

module.exports = function(opt, cb) {
   var extraction = new RegExp('href="(.*?)".*?>(.*?)<', 'i');
   var content = opt.content;
   var results = {
      found: 0,
      filtered: 0,
      links: []
   };

   if (!content || typeof content !== 'string') {
      return cb(null, results);
   }

   content.split('\n').forEach(function(line) {
      var details = extraction.exec(line);

      if (details) {
         var url = details[1];
         var info = getInfo(details[2]);
         var link = parseLink(url);
         results.found++;

         if (link && link.type in opt.types) {
            results.links.push({
               title: info.title,
               artist: info.artist,
               url: url
            });
         } else {
            results.filtered++;
         }
      }
   });

   cb(null, results);
}

},{"link-id":"/home/tully/www/linkwrapper.com/node_modules/link-id/index.js"}],"/home/tully/www/linkwrapper.com/public/js/player/util/index.js":[function(require,module,exports){
'use strict';

var Notification = null;
var preload = require('./preload');
var extract = require('./extractor');

module.exports = {
   UNAUTHORIZED: 401,
   SUCCESS: 0,
   ERROR: 100,

   init: function(notify) {
      // wtf fb
      if (window.location.hash.match(/#.*/)) {
         window.location.hash = '';
         history.pushState('', document.title, window.location.pathname);
      }

      // get bar width
      var box = $( '<div><div></div></div>' )
          .css({
              position: 'absolute',
              left: -1000,
              width: 300,
              overflow: 'scroll'
          })
          .appendTo( 'body' );
      var barWidth = box.width() - box.find( 'div' ).width();
      box.remove();
      $('#list-head').css('margin-right', barWidth);

      preload.all();
      Notification = notify;
   },

   serialize: function(obj) {
      var o = {};
      var a = obj.serializeArray();
      $.each(a, function() {
         o[this.name] = this.value || '';
      });
      return o;
   },

   futureDate: function(seconds) {
      var d = new Date();
      d.setSeconds(d.getSeconds() + seconds);
      return d;
   },

   parseResponse: function(data) {
      if (!data ||  !data.responseText) {
         return null;
      }

      // unauthorised
      if (data.status === 401) {
         new Notification({
            type: 'error',
            msg: 'Your session has expired. Please <a href="/">' +
                 '<strong class="notification-link">login</strong>' +
                 '</a> to use this feature.'
         });

         return null;
      }

      try {
         var res = $.parseJSON(data.responseText);

         if (res.msg) {
            res.msg = Mustache.render(res.msg, res.data);
         }

         res.status = data.status;

         return res;
      } catch (e) {
         return null;
      }
   },

   mongoId: function(id) {
      return typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/);
   },

   buildLink: function(link) {
      link = link.closest('.wrapped-link');
      return {
         type: 'main',
         title: link.find('.title').text(),
         artist: link.find('.artist').text(),
         other: link.find('.other').text(),
         url: link.find('.url').text(),
         _id: link.find('._id').text(),
         category: link.find('.category').text(),
         playCount: parseInt(link.find('.play-count').text()),
         obj: link
      };
   },

   extract: extract
};

},{"./extractor":"/home/tully/www/linkwrapper.com/public/js/player/util/extractor.js","./preload":"/home/tully/www/linkwrapper.com/public/js/player/util/preload.js"}],"/home/tully/www/linkwrapper.com/public/js/player/util/preload.js":[function(require,module,exports){
'use strict';

var images = [
   // cloudflare's problem
   '/account.png',
   '/addFile.png',
   '/addSuggestion.png',
   '/cancel.png',
   '/cancelRename.png',
   '/close.png',
   '/expand.png',
   '/finishRename.png',
   '/grabLink.png',
   '/grabList.png',
   '/leftArrowInverse.png',
   '/leftArrow.png',
   '/libraryIconInverse.png',
   '/libraryIcon.png',
   '/playerSettings.png',
   '/playIcon.png',
   '/playing.png',
   '/playlistsIconInverse.png',
   '/playlistsIcon.png',
   '/remove.png',
   '/rename.png',
   '/repeatActive.png',
   '/rightArrowInverse.png',
   '/rightArrow.png',
   '/shuffleActive.png',
   '/sortDown.png',
   '/sortUp.png',
   '/locked.png',
   '/unlocked.png',
   '/soundCloudIcon.png',
   '/vimeoIcon.png',
   '/youTubeCube.png',
   '/bitcoin.png',
   '/octocat.png'
];

module.exports = {
   all: function() {
      images.forEach(function(path) {
         (new Image()).src = '/img' + path;
      });
   }
};

},{}]},{},["/home/tully/www/linkwrapper.com/public/js/index.js"]);
