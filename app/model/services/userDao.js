'use strict';

var config = require('r/config/settings');
var db = require('r/app/util/db');
var validRemoteUser = require('r/app/model/remoteUser');
var validUser = require('r/app/model/user');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var mail = require('r/app/util/mail');

var SUCCESS = 0;

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
      db.users.findOne({_id: db.mongoID(userId)}, function(err, user) {
         if (err) {
            cb(err, user);
         } else if (!user) {
            cb(null, null);
         } else {
            cb(null, user);
         }
      });
   },

   getUserLists: function (userId, cb) {
      var id = db.mongoID(userId);

      db.categories
        .find({owner: id})
        .sort({order: 1})
        .toArray(function(err, categories) {
           if (err) {
              cb(127);
           } else {
              db.playlists
                .find({owner: id})
                .sort({order: 1})
                .toArray(function(err, playlists) {
                   if (err) {
                      cb(127);
                   } else {
                      cb(SUCCESS, {
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
      db.users.findOne({_id: db.mongoID(userId)}, function(err, user) {
         if (err || !user) {
            cb(130);
         } else {
            for (var field in edit) {
               if (field === 'settings') {
                  for (var s in edit[field]) {
                     user.settings[s] = edit.settings[s];
                  }
               } else if (field === 'email' && user.email !== edit.email) {
                  if (!mail.validEmail(edit.email)) {
                     return cb(136);
                  }

                  if (user.newMail !== edit.email) {
                     user.token = crypto.randomBytes(20).toString('hex');
                     user.newEmail = edit.email;
                  }
               } else {
                  user[field] = edit[field];
               }
            }

            if ((user.type === 'local') ? validUser(user) : validRemoteUser(user)) {
               db.users.save(user, function(err) {
                  if (err) {
                     cb(130);
                  } else {
                     if (user.token) {
                        mail.sendMail({
                           from: config.defaultEmail,
                           to: edit.email,
                           subject: 'Email Address Confirmation',
                           text: 'You have requested to update your linkwrapper.com email address. ' +
                                 'Please confirm your new address by clicking on the link below:\n' +
                                 config.serverUrl + '/confirm?s=' + user.token + '&u=' + user.email
                        }, function(err, res) {
                           // attempt only
                        });
                     }
                     cb(SUCCESS);
                  }
               });
            } else {
               cb(137);
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
            return cb(131, user);
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
                     return cb(132);
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
               return cb(133);
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
      if (!validUser(newUser, true)) {
         return cb(134);
      }

      bcrypt.hash(newUser.password, config.hashStrength, function(err, hash) {
         if (err) {
            return cb(134);
         }

         newUser.password = hash;
         newUser.token = crypto.randomBytes(20).toString('hex');

         db.users.insert(newUser, {safe: true}, function(err, user) {
            if (err || !user) {
               if (err.code === 11000) {
                  cb(135);
               } else {
                  cb(134);
               }
            } else {
               mail.sendMail({
                  from: config.defaultEmail,
                  to: newUser.email,
                  subject: 'New Account',
                  text: 'Welcome to linkwrapper!\n' +
                        'Follow the link below to activate your new account:\n' +
                        config.serverUrl + '/activate?s=' + newUser.token + '&u=' + newUser.email
               }, function(err, res) {
                  cb(SUCCESS, user);
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
            if (validUser(user)) {
            db.users.save(user, function(err) {
               if (err) {
                  cb(err);
               } else {
                  cb(false);
               }
            });
            } else {
               cb(true);
            }
         }
      });
   },

   confirmEmail: function(email, token, cb) {
      db.users.findOne({
         email: email,
         token: token
      }, function(err, user) {
         if (err || !user) {
            cb(err || true);
         } else {
            user.email = user.newEmail;
            delete user.newEmail;
            delete user.token;

            if ((user.type === 'local') ? validUser(user, true) : validRemoteUser(user)) {
               db.users.save(user, function(err) {
                  console.log(err);
                  if (err) {
                     var msg = null;
                     if (err.code === 11000) {
                        msg = 'Your email address could not be updated as the ' +
                              'provided email is currently attached to another account.';
                        cb(err, msg);
                     } else {
                        cb(err, 'boom');
                     }
                  } else {
                     cb(false);
                  }
               });
            } else {
               cb(true);
            }
         }
      });
   }
};
