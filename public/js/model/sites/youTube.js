'use strict';

var YouTube = function (playerId) {
   this.id = playerId;
   this.container = null;
   this.player = null;
}

module.exports = YouTube;

YouTube.prototype.init = function(container, emit) {
   var settings = {
      height: '100%',
      width: '100%',
      playerVars: {
         showinfo: 0,
         wmode: 'opaque'
      },

      events: {
         onStateChange: function(e) {
            if (e.data === YT.PlayerState.PLAYING) {
               var url = e.target.getVideoUrl();
               emit('playing', {
                  url: url,
                  time: e.target.getDuration()
               });
            } else if (e.data === YT.PlayerState.ENDED) {
               emit('ended', {
                  url: e.target.getVideoUrl()
               });
            } else if (e.data === YT.PlayerState.PAUSED) {
               emit('paused', {
                  url: e.target.getVideoUrl()
               });
            }
         },

         onError: function(e) {
            var errorTypes = {
               2: 'invalid parameter',
               5: 'html5 error',
               100: 'not found',
               101: 'cannot embed',
               150: 'cannot embed'
            };

            emit('error', {
               message: errorTypes[e.data]
            });
         }
      }
   };

   if (window.YT) {
      this.player = new YT.Player(this.id, settings);
   } else {
      var resource = document.createElement('script');
      var target = document.createElement('div');
      var script = document.getElementsByTagName('script')[0];
      var that = this;

      window.onYouTubeIframeAPIReady = function() {
         that.player = new YT.Player(that.id, settings);
      }

      resource.src = 'http://www.youtube.com/iframe_api';
      script.parentNode.insertBefore(resource, script);
      target.id = this.id;
      container.appendChild(target);
   }
}

YouTube.prototype.play = function(videoId) {
   if (this.player) {
      this.player.loadVideoById(videoId);
      var that = this;
   } else {
      this.player = new YT.Player(that.id, settings);
      console.log('[PlayerManager] YouTube player is not ready.');
   }
}

YouTube.prototype.stop = function() {
   this.player.stopVideo();
}

YouTube.prototype.getDetails = function() {
   // TODO
}
