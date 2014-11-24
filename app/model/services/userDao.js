'use strict';

var config = require('r/config/settings');
var db = require('r/app/util/db');
var validRemoteUser = require('r/app/model/remoteUser');
var validUser = require('r/app/model/user');
var BSON = require('mongodb').BSONPure;
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var mailer = require('r/app/util/mail');

module.exports = {
   getUser: function(criteria, cb) {
      db.users.findOne(criteria, function(err, user) {
         if (err) {
            return cb(err, user);
         } else if (!user) {
            return cb(null, null);
         } else {
            return cb(null, user);
         }
      });
   },

   getUserById: function(userId, cb) {
      db.users.findOne({_id: BSON.ObjectID(userId)}, function(err, user) {
         if (err) {
            cb(err, user);
         } else if (!user) {
            cb(null, null);
         } else {
            cb(null, user);
         }
      });
   },

   getLists: function (userId, cb) {
      var id = BSON.ObjectID(userId);

      db.categories
        .find({owner: id})
        .sort({order: 1})
        .toArray(function(err, categories) {
           if (err) {
              cb(err);
           } else {
              db.playlists
                .find({owner: id})
                .sort({order: 1})
                .toArray(function(err, playlists) {
                   if (err) {
                      cb(err);
                   } else {
                      cb(null, {
                         categories: categories,
                         playlists: playlists
                      });
                   }
                });
           }
         });
   },

   editUser: function(userId, edit, cb) {
      edit = edit || {};
      db.users.findOne({_id: BSON.ObjectID(userId)}, function(err, user) {
         if (err || !user) {
            cb({
               msg: 'Unable to edit details.'
            });
         } else {
            for (var field in edit) {
               if (field === 'settings') {
                  for (var s in edit[field]) {
                     user.settings[s] = edit.settings[s];
                  }
               } else {
                  user[field] = edit[field];
               }
            }

            if ((user.type === 'local') ? validUser(user) : validRemoteUser(user)) {
               db.users.save(user, function(err) {
                  cb(err);
               });
            } else {
               cb({
                  msg: 'Invalid details.'
               });
            }
         }
      });
   },

   handleRemoteUser: function(type, remoteUser, cb) {
      var validTypes = config.loginMethods;

      if (validTypes.indexOf(type) < 0) {
         return cb(null, false);
      }

      db.users.findOne({type: type, remoteId: remoteUser.id}, function(err, user) {
         if (err) {
            return cb({
               type: 'error',
               msg: 'Error retrieving remote user.',
               obj: err
            }, user);
         } else if (user) {
            return cb(null, user);
         } else {
            var first = remoteUser.first_name || remoteUser.given_name || '';
            var newUser = {
               type: type,
               first: first,
               last: remoteUser.last_name || remoteUser.family_name,
               display: first.substr(0, 14),
               remoteId: remoteUser.id,
               joined: new Date(),
               active: true,
               settings: {
                  theme: 'light',
                  suggestions: 'youtube'
               }
            };

            if (remoteUser.email) {
               newUser.email = remoteUser.email;
            }

            if (validRemoteUser(newUser)) {
               db.users.insert(newUser, {safe: true}, function(err, result) {
                  var user = result[0];
                  if (err || !user) {
                     console.error(err);
                     return cb({
                        type: 'error',
                        msg: 'Error adding remote user.',
                        obj: err
                     });
                  } else {
                     db.categories.insert({
                        name: config.initCategory,
                        owner: user._id,
                        order: 0
                     }, function(err) {
                        cb(null, user); 
                     });
                  }
               });
            } else {
               return cb({
                  type: 'error',
                  msg: 'Invalid remote user.'
               });
            }
         }
      });
   },

   listUsers: function(criteria, cb) {
      db.users.find(criteria).toArray(function(err, users) {
         if (err) {
            return cb(err, users);
         } else if (!users) {
            return cb(null, null);
         } else {
            return cb(null, users);
         }
      });
   },

   newUser: function(newUser, cb) {
      var genericError = {
         type: 'error',
         msg: 'There was an error creating your account. ' +
              'Please check your details and try again.'
      };

      if (!validUser(newUser, true)) {
         return cb(genericError);
      }

      bcrypt.hash(newUser.password, config.hashStrength, function(err, hash) {
         if (err) {
            return cb(genericError);
         }

         newUser.password = hash;
         newUser.token = crypto.randomBytes(20).toString('hex');

         db.users.insert(newUser, {safe: true}, function(err, user) {
            if (err || !user) {
               if (err.code === 11000) {
                  cb({
                     type: 'error',
                     msg: 'An account already exists for the provided email.'
                  });
               } else {
                  cb(genericError);
               }
            } else {
               if (!config.mailServer) {
                  console.log('Mail server unset.');
                  return cb(null, user);
               }

               mailer.sendMail({
                  from: config.defaultEmail,
                  to: newUser.email,
                  subject: 'New Link Wrapper Account',
                  text: 'Welcome to Link Wrapper!\n' +
                        'Please follow the link below to activate your new account:\n' +
                        config.serverUrl + '/activate?s=' + newUser.token + '&u=' + newUser.email
               }, function(err, response) {
                  if (err) {
                     console.error(err);
                     cb(genericError);
                  } else {
                     cb(null, user);
                  }
               });
            }
         });
      });
   },

   activateUser: function(email, token, cb) {
      db.users.findOne({
         email: email,
         token: token
      }, function(err, user) {
         if (err || !user) {
            cb(err || true);
         } else {
            user.active = true;
            delete user.token;
            db.users.save(user, function(err) {
               if (err) {
                  cb(err);
               } else {
                  cb(false);
               }
            });
         }
      });
   },

   addCategory: function(userId, title, cb) {
      db.users.findOne({_id: userId}, function(err, user) {
         if (err) {
            console.log(err);
            cb(err);
         } else {
            var userCategories = user.categories;

            // check title doesn't exist
            if (userCategories) {
               var c = title.toLowerCase();
               for (var i = 0; i < userCategories.length; ++i) {
                  if (c === userCategories[i].name.toLowerCase()) {
                     return cb({msg: 'Category exists.'});
                  }
               }
            } else {
               return cb({msg: 'Defective user object'});
            }

            userCategories.push({
               name: title
            })

            db.users.save(user, function(err) {
               if (err) {
                  console.error(err);
                  cb(err);
               } else {
                  cb(null);
               }
            });
         }
      });
   },

   removeCategory: function(userId, title, cb) {
      db.users.findOne({_id: userId}, function(err, user) {
         if (err) {
            console.log(err);
            cb(err);
         } else {
            var userCategories = user.categories;

            // check title doesn't exist
            if (userCategories && (typeof title === 'string')) {
               userCategories = userCategories.filter(function(c) {
                  if (c.name !== title) {
                     return c;
                  }
               });
               user.categories = userCategories;
            } else {
               return cb({msg: 'Invalid user object'});
            }

            db.users.save(user, function(err) {
               if (err) {
                  console.error(err);
                  cb(err);
               } else {
                  cb(null);
               }
            });
         }
      });
   },

   addPlaylist: function(userId, title, cb) {
      db.users.findOne({_id: userId}, function(err, user) {
         if (err) {
            console.log(err);
            cb(err);
         } else {
            var userPlayLists = user.playlists;

            // check title doesn't exist
            if (userPlayLists) {
               var c = title.toLowerCase();
               for (var i = 0; i < userPlayLists.length; ++i) {
                  if (c === userPlayLists[i].name.toLowerCase()) {
                     return cb({msg: 'Playlist exists.'});
                  }
               }
            } else {
               return cb({msg: 'Defective user object'});
            }

            userPlayLists.push({
               name: title,
               links: []
            })

            db.users.save(user, function(err) {
               if (err) {
                  console.error(err);
                  cb(err);
               } else {
                  cb(null);
               }
            });
         }
      });
   }
};
