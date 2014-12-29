'use strict';

var dialogues = {
   // success
   0: null,

   10: 'Found <strong>{{ valid }}</strong> supported links ' +
        'and <strong>{{ inserted }}</strong> new links.',
   11: '<strong>{{ added }}</strong> link{{ plural }} added to <strong>{{ playlist }}</strong>.',
   12: '<strong>{{ removed }}</strong> link{{ plural }} removed from {{ playlist }}.',
   13: 'Added <strong>1</strong> link to <strong>{{ categoryName }}</strong>.',
   20: '{{ update }} successfully updated.',
   30: 'A confirmation email was sent to <strong>{{ newEmail }}</strong>.',


   // error
   100: null,

   101: 'Unable to process your request.',
   110: 'Unsupported link type.',
   111: 'Link already exists in <strong>{{ category }}</strong>.',
   112: 'Unable to add link at this time.',
   113: 'Unable to edit link at this time.',
   114: 'Invalid link details.',
   115: 'Unable to retrieve links at this time.',
   116: 'Unable to extract some links.',
   117: 'Invalid collection.',
   118: 'Collection no longer exists.',

   120: 'Unable to create collection at this time.',
   121: 'Unable to create playlist at this time.',
   122: 'Some links could not be added to the playlist.',
   123: 'Maximum list length of <strong>{{ max }}</strong> reached for <strong>{{ name }}</strong>.',
   124: 'Unable to update playlist at this time',
   125: 'Some lists could not be deleted at this time.',
   126: 'Some lists could not be updated at this time.',
   127: 'An error occurred while retrieving your lists.',
   128: 'An error occurred while syncing the order of <strong>{{ playlist }}</strong>.',

   130: 'Unable to update details at this time.',
   131: 'Error retrieving remote user.',
   132: 'Error adding remote user.',
   133: 'Invalid remote user.',
   134: 'An error occurred during the creation of your account. ' +
        'Please check your details and try again.',
   135: 'An account already exists for the provided email.',
   136: 'Invalid email address.',
   137: 'Invalid details.',
   138: 'Incorrect password.'
};

module.exports = {
   SUCCESS: 0,
   ERROR: 100,
   pack: function(opt) {
      var msg = dialogues[opt.code];
      var res = {
         type: (opt.code < 100) ? 'success' : 'error'
      };

      if (msg) {
         res.msg = msg;
      }

      if (opt.data) {
         res.data = opt.data;
      }

      return res;
   }
};
