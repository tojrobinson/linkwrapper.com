'use strict';

var dialogues = {
   // success
   0: null,

   10: 'Found <strong>{{ valid }}</strong> supported links ' +
        'and <strong>{{ inserted }}</strong> new links.',
   11: '<strong>{{ added }}</strong> link{{ plural }} added to {{ playlist }}',
   12: '<strong>{{ removed }}</strong> link{{ plural }} removed from {{ playlist }}',
   20: '{{ update }} successfully updated.',


   // error
   100: null,

   101: 'Unable to process your request.',
   110: 'Unsupported link type.',
   111: 'Link already exists.',
   112: 'Unable to add link at this time.',
   113: 'Unable to edit link at this time.',
   114: 'Invalid link details.',
   115: 'Unable to retrieve links at this time.',
   116: 'Unable to extract links.',
   117: 'Invalid collection.',
   118: 'Collection no longer exists',
   119: 'The file you are trying to upload is too large (<strong>5mb</strong> max).',

   120: 'Unable to create collection at this time.',
   121: 'Unable to create playlist at this time.',
   122: 'Some links could not be added to the playlist',
   123: 'Maximum playlist length reached for {{ playlist }}.',
   124: 'Unable to update playlist at this time',
   125: 'Some lists could not be deleted at this time.',
   126: 'Some lists could not be updated at this time.',
   127: 'An error occurred while retrieving your lists.',

   130: 'Unable to update details at this time.',
   131: 'Error retrieving remote user.',
   132: 'Error adding remote user.',
   133: 'Invalid remote user',
   134: 'An error occurred during the creation of your account. ' +
        'Plase check your details and try again.',
   135: 'An account already exists for the provided email'
};

module.exports = {
   SUCCESS: 0,
   ERROR: 100,
   pack: function(code, data) {
      var msg = dialogues[code];
      var res = {
         type: (code < 100) ? 'success' : 'error'
      };

      if (msg) {
         res.msg = msg;
      }

      if (data) {
         res.data = data;
      }

      return res;
   }
};
