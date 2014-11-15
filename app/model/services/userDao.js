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
      db.users.findOne({_id: new BSON.ObjectID(userId)}, function(err, user) {
         if (err) {
            cb(err, user);
         } else if (!user) {
            cb(null, null);
         } else {
            cb(null, user);
         }
      });
   },

   updateUser: function(userId, mod, cb) {
      db.users.update(
         {_id: userId},
         mod,
         {upsert: false, multi: false},
         function(err) {
            if (err) {
               console.error(err);
               cb(err);
            } else {
               cb(null);
            }
         }
      );
   },

   handleRemoteUser: function(type, remoteUser, cb) {
      var validTypes = config.loginMethods;

      if (validTypes.indexOf(type) < 0) {
         return cb(null, false);
      }

      db.users.findOne({type: type, remote_id: remoteUser.id}, function(err, user) {
         if (err) {
            return cb(err, user);
         } else if (!user) {
            var newUser = {
               type: type,
               first: remoteUser.first_name || remoteUser.given_name,
               last: remoteUser.last_name || remoteUser.family_name,
               display: remoteUser.first_name || remoteUser.given_name,
               remote_id: remoteUser.id,
               joined: new Date(),
               active: true,
               settings: {
                  theme: 'light'
               },
               categories: [{name: config.defaultCategory, order: 0}],
               playlists: []
            };

            if (remoteUser.email) {
               newUser.email = remoteUser.email;
            }

            if (validRemoteUser(newUser)) {
               db.users.insert(newUser, {safe: true}, function(err, result) {
                  if (err) {
                     console.error(err);
                     return cb(err, null);
                  } else {
                     return cb(null, result[0]);
                  }
               });
            } else {
               return cb(null, false);
            }
         } else {
            return cb(err, user);
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
      var genericError= {
         msg: 'There was an error creating your account. Please check your details and try again.'
      };

      if (!validUser(newUser, true)) {
         return cb(genericError);
      }

      db.users.find({type: 'local', email: newUser.email}).count(function(err, count) {
         if (err) {
            cb(genericError);
         } else if (count > 0) {
            cb({msg: 'Email exists.'});
         } else {
            bcrypt.hash(newUser.password, config.hashStrength, function(err, hash) {
               if (err) {
                  return cb(genericError);
               }

               newUser.password = hash;
               newUser.token = crypto.randomBytes(20).toString('hex');

               db.users.insert(newUser, {safe: true}, function(err, user) {
                  if (err) {
                     console.log(err);
                     cb(genericError);
                  } else if (!user) {
                     cb(genericError);
                  } else {
                     if (config.mailServer) {
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
                              cb(false);
                           }
                        });
                     } else {
                        console.log('No mail server configured.');
                        cb(false);
                     }
                  }
               });
            });
         }
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
