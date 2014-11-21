'use strict';

var API_KEY = 'AIzaSyAmrt-iTLV-IZbgvNZ5TxhEKUVme41O2Us';
var API_URL = 'https://www.googleapis.com/youtube/v3/';

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
         wmode: 'opaque',
         html5: 1 // fix permission denied error in FF
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
   }
}

YouTube.prototype.stop = function() {
   if (this.player) {
      this.player.stopVideo();
   }
}

YouTube.prototype.getPlaying = function() {
   var player = this.player;
   return player && {
      url: player.getVideoUrl()
   };
}

YouTube.prototype.getRelated = function(id, cb) {
   $.ajax({
      type: 'GET',
      url: API_URL + 'search?part=snippet&type=video&maxResults=20&relatedToVideoId=' + id + '&key=' + API_KEY,
      complete: function(data) {
         var res = {};
         var related = {};
         var id = 0;

         try {
            res = JSON.parse(data.responseText);
         } catch (e) {
            res.items = [];
         }

         res.items.forEach(function(i) {
            var info = i.snippet;
            var artist = info.title.substr(0, info.title.indexOf('-'));
            var title = info.title.substr(info.title.indexOf('-') + 1);
            related[id] = {
               id: id++,
               url: 'https://www.youtube.com/watch?v=' + i.id.videoId,
               title: title,
               artist: artist,
               other: '',
               description: info.description,
               thumb: info.thumbnails.default.url,
               channel: info.channelTitle
            };
         });

         cb(related);
      }
   });
}

YouTube.prototype.getDetails = function(id, cb) {

}

YouTube.prototype.search = function(term, cb) {
   $.ajax({
      type: 'get',
      url: API_URL + 'search?part=snippet&maxResults=20&q=' + term + '&key=' + API_KEY,
      complete: function(data) {
         var res = JSON.parse(data.responseText);
         var items = [];

         res.items.forEach(function(i) {
            var info = i.snippet;
            items.push({
               url: 'https://www.youtube.com/watch?v=' + i.id.videoId,
               title: info.title,
               description: info.description,
               thumb: info.thumbnails.default.url,
               channel: info.channelTitle
            });
         });

         if (items.length) {
            cb(items);
         } else {
            cb(null);
         }
      }
   });
}
