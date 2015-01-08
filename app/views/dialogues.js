'use strict';

var dialogues = {
   // success
   0: null,

   10: 'Found <strong>{{ valid }}</strong> supported links. ' +
       '<strong>{{ inserted }}</strong> new links were added.',
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
   116: 'Some links could not be extracted.',
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
   137: 'Some details were invalid or could not be updated.',
   138: 'Incorrect password.',

   140: 'You cannot do that with a guest account.',
   141: 'This activation link has expired.',
   142: 'Your account could not be activated at this time.',
   143: 'Your email address could not be updated at this time.',
   144: 'This email address is currently attached to another account.'
};

module.exports = {
   SUCCESS: 0,
   ERROR: 100,
   pack: function(opt) {
      if (!opt) {
         return {};
      }
      
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
