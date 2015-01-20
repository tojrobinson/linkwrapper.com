'use strict';

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

Vimeo.prototype.init = function(container, emit) {
   var id = this.id;
   this.container = container;
   this.emit = emit;
   var iframe = $('<iframe>').attr({
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

Vimeo.prototype.search = function(term, cb) {
   // TODO
}
