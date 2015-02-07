'use strict';

var API_KEY = '4c3d89782f9da0cb5517b3e770df21c1';
var API_URL = 'https://api.soundcloud.com';
var DEFAULT_THUMB = '/img/soundCloudDefault.png';
var SoundCloud = function (playerId) {
   this.id = playerId;
   this.container = null;
   this.player = null;
}

module.exports = SoundCloud;

SoundCloud.prototype.init = function(container, emit) {
   this.emit = emit;
   var id = this.id;

   var iframe = $('<iframe class="player">').attr({
      id: id,
      height: '98%',
      width: '98%',
      frameborder: '0'
   }).css({
      display: 'none',
      position: 'absolute',
      top: '1%',
      left: '5px'
   });

   $(container).append(iframe);
}

SoundCloud.prototype.load = function(id) {
   var player = this.player;
   var playerId = this.id;
   var that = this;
   var opt = {
      auto_play: true,
      visual: true,
      show_user: false,
      show_artwork: false,
      liking: false,
      show_playcount: false,
      show_comments: false,
      buying: false,
      download: false,
      sharing: false
   };

   SoundCloud.prototype.getDetails(id, function(track) {
      if (!track || !track.embed) {
         return false;
      }

      // late creation since empty src breaks widget
      if (!player) {
         $('#' + playerId).attr('src', 'https://w.soundcloud.com/player/?' + $.param(opt) + '&url=' + track.embed);
         that.player = player = SC.Widget(playerId);

         player.bind(SC.Widget.Events.PLAY, function(e) {
            // equalise with other players
            player.setVolume(0.7);

            player.getCurrentSound(function(sound) {
               that.emit('playing', {url: sound.permalink_url});
            });
         });

         player.bind(SC.Widget.Events.FINISH, function(e) {
            player.getCurrentSound(function(sound) {
               that.emit('ended', {url: sound.permalink_url});
            });
         });
      } else {
         player.load(track.embed, opt);
      }
   });
}

SoundCloud.prototype.play = function() {
   this.player.play();
}

SoundCloud.prototype.stop = function() {
   this.player.pause();
}

SoundCloud.prototype.pause = function() {
   this.player.pause();
}

SoundCloud.prototype.getPlaying = function() {
   return this.player.getCurrentSound(function(sound) {
      return {
         url: sound.permalink_url
      };
   });
}

SoundCloud.prototype.getDetails = function(id, cb) {
   var toResolve = 'http://soundcloud.com/' + id;
   var resolve = API_URL + '/resolve.json?url=' + toResolve + '&client_id=' + API_KEY;

   $.ajax({
      type: 'get',
      url: resolve,
      complete: function(data) {
         var details;

         try {
            var res = $.parseJSON(data.responseText);
            details = {
               title: res.title,
               artist: res.user.username,
               thumb: res.artwork_url,
               description: res.description,
               embed: res.uri,
               id: res.id
            };
         } catch (e) {
            details = null;
         }

         return cb(details);
      }
   });
}

SoundCloud.prototype.search = function(opt, cb) {
   var url = API_URL + '/tracks?limit=20&q=' + opt.term + '&client_id=' + API_KEY;

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
            res = [];
         }

         res.forEach(function(i) {
            if (i.description && i.description.length > 200) {
               i.description = i.description.substring(0,200) + '...';
            }

            i.artwork_url = i.artwork_url || DEFAULT_THUMB;

            results.push({
               id: id++,
               url: i.permalink_url,
               title: i.title,
               originalTitle: i.title,
               artist: i.user.username,
               other: '',
               description: i.description,
               thumb: i.artwork_url,
               channel: i.user.username
            });
         });

         cb(results);
      }
   });
}
