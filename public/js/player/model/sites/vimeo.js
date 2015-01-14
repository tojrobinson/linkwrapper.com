'use strict';

var Vimeo = function(playerId) {
   this.id = playerId;
   this.container = null;
   this.player = null;
}

module.exports = Vimeo;

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
   // TODO
}

Vimeo.prototype.search = function(term, cb) {
   // TODO
}
