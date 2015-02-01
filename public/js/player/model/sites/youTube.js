'use strict';

var util = require('../../util');

var API_KEY = 'AIzaSyDdMoNOsXXFhZBrdlsWA8FKolIObYK-kAY';
var API_URL = 'https://www.googleapis.com/youtube/v3/';
var YouTube = function (playerId) {
   this.id = playerId;
   this.container = null;
   this.player = null;
}

module.exports = YouTube;

function parseTitle(info) {
   var title = info.title.substr(info.title.indexOf('-') + 1);
   var artist = info.title.substr(0, info.title.indexOf('-')) || info.channelTitle;

   return {
      title: title && title.trim() || '',
      artist: artist && artist.trim() || ''
   };
}

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
      var mount = document.getElementsByTagName('script')[0];
      var that = this;

      window.onYouTubeIframeAPIReady = function() {
         that.player = new YT.Player(that.id, settings);
      }

      resource.src = 'https://www.youtube.com/iframe_api';
      mount.parentNode.insertBefore(resource, mount);
      target.id = this.id;
      container.appendChild(target);
   }
}

YouTube.prototype.load = function(videoId) {
   this.player.loadVideoById(videoId);
}

YouTube.prototype.play = function() {
   this.player.playVideo();
}

YouTube.prototype.stop = function() {
   this.player.stopVideo();
}

YouTube.prototype.pause = function() {
   this.player.pauseVideo();
}

YouTube.prototype.getPlaying = function() {
   var player = this.player;
   return {
      url: player.getVideoUrl()
   };
}

YouTube.prototype.getDetails = function(id, cb) {
   var url = API_URL + 'videos?part=snippet&maxResults=1&id=' + id + '&key=' + API_KEY;

   $.ajax({
      type: 'get',
      url: url,
      complete: function(data) {
         var details;

         try {
            var res = $.parseJSON(data.responseText);
            var info = res.items[0].snippet;
            var split = parseTitle(info);

            details = {
               artist: split.artist,
               title: split.title,
               description: info.description,
               thumb: info.thumbnails.default.url,
               channel: info.channelTitle
            };
         } catch (e) {
            details = null;
         }

         cb(details);
      }
   });
}

YouTube.prototype.search = function(opt, cb) {
   var url = API_URL + 'search?part=snippet&maxResults=20&type=video&videoEmbeddable=true&key=' + API_KEY; 

   if (opt.type === 'related') {
      url += '&relatedToVideoId=' + opt.id;
   } else {
      url += '&q=' + opt.term;
   }

   $.ajax({
      type: 'get',
      url: url,
      complete: function(data) {
         var res = {};
         var results = [];
         var id = 0;

         try {
            res = $.parseJSON(data.responseText);
         } catch (e) {
            res.items = [];
         }

         res.items = res.items || [];

         res.items.forEach(function(i) {
            var info = i.snippet;
            var split = parseTitle(info);

            results.push({
               id: id++,
               url: 'https://www.youtube.com/watch?v=' + i.id.videoId,
               title: split.title,
               artist: split.artist,
               other: '',
               description: info.description,
               thumb: info.thumbnails.default.url,
               channel: info.channelTitle,
               originalTitle: info.title
            });
         });

         cb(results);
      }
   });
}
