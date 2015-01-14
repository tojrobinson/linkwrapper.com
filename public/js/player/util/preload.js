'use strict';

// cloudflare's problem
var images = [
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
   '/octocat.png',
   '/twitter.png'
];

module.exports = {
   all: function() {
      images.forEach(function(path) {
         (new Image()).src = '/img' + path;
      });
   }
};
