'use strict';

var images = [
   '/account.png',
   '/addFile.png',
   '/addSuggestion.png',
   '/cancel.png',
   '/cancelRename.png',
   '/close.png',
   '/expand.png',
   '/facebookLogin.png',
   '/finishRename.png',
   '/googleLogin.png',
   '/grabLink.png',
   '/grabList.png',
   '/itemOptions.png',
   '/leftArrowInverse.png',
   '/leftArrow.png',
   '/libraryIconInverse.png',
   '/libraryIcon.png',
   '/playerSettings.png',
   '/playIcon.png',
   '/playing.png',
   '/playlistsIconInverse.png',
   '/playlistsIcon.png',
   '/plus.png',
   '/remove.png',
   '/rename.png',
   '/repeatActive.png',
   '/rightArrowInverse.png',
   '/rightArrow.png',
   '/shuffleActive.png',
   '/sortDown.png',
   '/sortUp.png',
];


module.exports = {
   all: function() {
      images.forEach(function(path) {
         new Image().src = '/img' + path;
      });
   }
};
