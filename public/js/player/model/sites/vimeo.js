'use strict';

// currently no dynamic client side token generation
var API_KEY = '4651e51931840fcd8f9c1811a93d3999';
var API_URL = 'https://api.vimeo.com/';

var Vimeo = function(playerId) {
   this.id = playerId;
   this.container = null;
   this.player = null;
}

module.exports = Vimeo;

function parseTitle(info) {
   var title = info.title.substr(info.title.indexOf('-') + 1);
   var artist = info.title.substr(0, info.title.indexOf('-')) || info.user_name;

   return {
      title: title && title.trim() || '',
      artist: artist && artist.trim() || ''
   };
}

function parseSearch(info) {
   var title = info.name.substr(info.name.indexOf('-') + 1);
   var artist = info.name.substr(0, info.name.indexOf('-')) || info.user.name;

   return {
      title: title && title.trim() || '',
      artist: artist && artist.trim() || ''
   };
}

Vimeo.prototype.init = function(container, emit) {
   this.container = container;
   this.emit = emit;
   var id = this.id;

   var iframe = $('<iframe class="player">').attr({
      id: id,
      src: '',
      height: '100%',
      width: '100%',
      frameborder: '0'
   }).css({
      display: 'none',
      position: 'absolute',
      top: '0',
      left: '0'
   });

   $(container).append(iframe)
}

Vimeo.prototype.load = function(videoId) {
   var embedStr = 'https://player.vimeo.com/video/' + videoId +
                  '?api=1&player_id=' + this.id + '&autoplay=1' +
                  '&title=0';
   var iframe = $('#' + this.id, '#player');
   iframe.attr('src', embedStr);

   // load api late as per vimeo docs
   if (!this.player) {
      this.player = $f(iframe[0]);
      var that = this;

      this.player.addEvent('ready', function() {
         that.player.addEvent('finish', function() {
            that.emit('ended', {
               url: that.player.api('getVideoUrl')
            });
         });

         that.player.addEvent('play', function() {
            that.emit('playing', {
               url: that.player.api('getVideoUrl')
            });
         });
      });
   }
}

Vimeo.prototype.play = function() {
   this.player.api('play');
}

Vimeo.prototype.stop = function() {
   //this.player.api('unload');
   $('#' + this.id, '#player').attr('src', '');
}

Vimeo.prototype.pause = function() {
   this.player.api('pause');
}

Vimeo.prototype.getPlaying = function() {
   var player = this.player;
   return {
      url: player.api('getVideoUrl')
   };
}

Vimeo.prototype.getDetails = function(id, cb) {
   var url = 'https://vimeo.com/api/v2/video/' + id + '.json';

   $.ajax({
      type: 'get',
      url: url,
      complete: function(data) {
         var details;

         try {
            var res = $.parseJSON(data.responseText);
            var info = res[0];
            var split = parseTitle(info);

            details = {
               artist: split.artist,
               title: split.title,
               description: info.description,
               thumb: info.thumbnail_medium,
               channel: info.user_name
            };
         } catch (e) {
            details = null;
         }

         return cb(details);
      }
   });
}

// deprecated until can limit returned data or api isn't so slow
Vimeo.prototype.search = function(opt, cb) {
   var url = API_URL + 'videos?page=1&per_page=20&fields=link,name,description,pictures.uri,user.name&query=' + opt.term;

   $.ajax({
      type: 'get',
      url: url,
      beforeSend: function(req, settings) {
         req.setRequestHeader('Authorization', 'Bearer ' + API_KEY);
      },
      complete: function(data) {
         var res = {};
         var results = [];
         var id = 0;

         try {
            res = $.parseJSON(data.responseText);
         } catch (e) {
            res.data = [];
         }

         res.data.forEach(function(i) {
            var split = parseSearch(i);
            var pictures = i.pictures && i.pictures.uri;
            var thumbId = pictures.match(/\d+$/);
            thumbId = thumbId && thumbId[0] || 'none';

            if (i.description && i.description.length > 200) {
               i.description = i.description.substring(0,200) + '...';
            }

            results.push({
               id: id++,
               url: i.link,
               title: split.title,
               originalTitle: i.name,
               artist: split.artist,
               other: '',
               description: i.description,
               thumb: 'https://i.vimeocdn.com/video/' + thumbId + '_120x90.jpg',
               channel: i.user.name
            });
         });

         cb(results);
      }
   });
}
