'use strict';

// cloudflare's problem
var images = [
   '/account.png',
   '/addFile.png',
   '/addOneIcon.png',
   '/bitcoin.png',
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
   '/linkMenu.png',
   '/locked.png',
   '/octocat.png',
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
   '/sortDown.png',
   '/sortUp.png',
   '/soundCloudDefault.png',
   '/soundCloudIcon.png',
   '/soundCloudSearch.png',
   '/shuffleActive.png',
   '/twitter.png',
   '/unlocked.png',
   '/vimeoIcon.png',
   '/youTubeCube.png',
   '/youTubeSearch.png'
];

module.exports = {
   all: function() {
      images.forEach(function(path) {
         (new Image()).src = '/img' + path;
      });
   }
};
