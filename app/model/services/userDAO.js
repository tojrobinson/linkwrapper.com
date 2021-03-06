'use strict';

var config = require('r/config/settings');
var db = require('r/app/util/db');
var validRemoteUser = require('r/app/model/remoteUser');
var validUser = require('r/app/model/user');
var bcrypt = require('bcrypt');
var mail = require('r/app/util/mail');

var GUEST_MINUTES = config.guestMinutes || 60;
var SUCCESS = 0;

module.exports = {
   getUser: function(query, cb, proj) {
      proj = proj || {};
      db.users.findOne(query, proj, cb);
   },

   getUserLists: function (userId, cb) {
      db.categories
        .find({owner: userId})
        .sort({order: 1})
        .toArray(function(err, categories) {
           if (err) {
              return cb(err, {code: 127});
           }

           db.playlists
             .find({owner: userId})
             .sort({order: 1})
             .toArray(function(err, playlists) {
                if (err) {
                   return cb(err, {code: 127});
                }

                cb(null, {
                   code: SUCCESS,
                   data: {
                      categories: categories,
                      playlists: playlists
                   }
                });
             });
         });
   },

   editUser: function(userId, edit, cb) {
      edit = edit || {};
      db.users.findOne({_id: userId}, function(err, user) {
         if (err || !user) {
            return cb(err, {code: 130});
         }

         var editPass = edit.editPass;
         edit.email = edit.email && edit.email.trim().toLowerCase();
         user.display = edit.display || '';

         for (var s in edit.settings) {
            user.settings[s] = edit.settings[s];
         }

         function finishEdit(err) {
            if (err) {
               return cb(err, {code: 130});
            }

            var resData = {
               display: user.display,
               email: user.email,
               settings: user.settings
            };

            if (edit.email && user.email !== edit.email) {
               if (!mail.validEmail(edit.email)) {
                  return cb(null, {code: 136});
               }

               db.transactions.insert({
                  type: 'confirmEmail',
                  from: user.email,
                  to: edit.email,
                  user: userId,
                  created: new Date()
               }, function(err, t) {
                  if (err || !t) {
                     return cb(err, {code: 137});
                  }

                  mail.send({
                     from: config.mail.defaultSender,
                     to: edit.email,
                     subject: 'Email Address Confirmation',
                     tmpl: {
                        name: 'mail/updateEmail',
                        ctx: {
                           domain: config.domain,
                           id: t[0] && t[0]._id
                        }
                     }
                  }, function(err) {
                     // attempt only
                  });

                  resData.newEmail = edit.email;

                  cb(null, {
                     code: 30,
                     data: resData
                  });
               })
            } else {
               cb(null, {
                  code: SUCCESS,
                  data: resData
               });
            }
         }

         if (editPass && user.type === 'local') {
            bcrypt.compare(editPass.currPassword, user.password, function(err, success) {
               if (!success) {
                  return cb(null, {code: 138});
               }

               bcrypt.hash(editPass.password, config.hashStrength, function(err, hash) {
                  if (err) {
                     return cb(err, {code: 130});
                  }

                  user.password = hash;

                  if (!((user.type === 'local') ? validUser(user) : validRemoteUser(user))) {
                     return cb(null, {code: 137});
                  }

                  db.users.save(user, finishEdit);
               });
            });
         } else {
            if (!((user.type === 'local') ? validUser(user) : validRemoteUser(user))) {
               return cb(null, {code: 137});
            }

            db.users.save(user, finishEdit);
         }
      });
   },

   handleRemoteUser: function(type, remoteUser, cb) {
      var validTypes = config.loginMethods;

      if (validTypes.indexOf(type) < 0) {
         return process.nextTick(function() {
            cb(null, null);
         });
      }

      db.users.findOne({
         remoteId: remoteUser.id,
         type: type
      }, {_id: 1}, function(err, user) {
         if (err) {
            return cb(null, null);
         } else if (user) {
            return cb(null, user);
         }

         var first = remoteUser.first_name || remoteUser.given_name || '';
         var newUser = {
            type: type,
            first: first,
            last: remoteUser.last_name || remoteUser.family_name,
            display: first.substr(0, 14),
            remoteId: remoteUser.id,
            joined: new Date(),
            settings: {
               theme: 'light',
               suggestions: 'youtube'
            }
         };

         if (remoteUser.email) {
            newUser.email = remoteUser.email.trim();
         }

         if (validRemoteUser(newUser)) {
            db.users.insert(newUser, {safe: true}, function(err, result) {
               var user = result[0];
               if (err || !user) {
                  return cb(err, null);
               }

               db.categories.insert({
                  name: config.initCategory,
                  owner: user._id,
                  order: 0
               }, function(err) {
                  cb(null, user); 
               });
            });
         } else {
            return cb(null, null);
         }
      });
   },

   newGuest: function(cb) {
      var expire = new Date();

      // expire 5 minutes after session expiration
      expire.setMinutes(expire.getMinutes() + GUEST_MINUTES + 5);

      var guest = {
         display: 'Guest',
         type: 'guest',
         expire: expire,
         settings: {
            theme: 'light',
            suggestions: 'youtube'
         },
      };

      db.users.insert(guest, function(err, inserted) {
         cb(err, inserted && inserted[0]);
      });
   },

   newUser: function(newUser, cb) {
      if (!validUser(newUser)) {
         return process.nextTick(function() {
            cb(null, {code: 134});
         });
      }

      bcrypt.hash(newUser.password, config.hashStrength, function(err, hash) {
         if (err) {
            return cb(err, {code: 134});
         }

         newUser.password = hash;

         db.users.findOne({
            email: newUser.email
         }, {
            _id: 1
         }, function(err, user) {
            if (err) {
               return cb(err, {code: 134});
            }

            if (user) {
               return cb(null, {code: 135});
            }

            db.transactions.insert({
               type: 'activate',
               user: newUser,
               created: new Date()
            }, {safe: true}, function(err, t) {
               if (err || !t) {
                  return cb(err, {code: 134});
               }

               mail.send({
                  from: config.mail.defaultSender,
                  to: newUser.email,
                  subject: 'New linkwrapper Account',
                  tmpl: {
                     name: 'mail/activate',
                     ctx: {
                        domain: config.domain,
                        id: t[0] && t[0]._id
                     }
                  }
               }, function(err) {
                  cb(err, {
                     code: SUCCESS,
                     data: {
                        email: newUser.email
                     }});
               });
            });
         });
      });
   },

   activateUser: function(id, cb) {
      db.transactions.findOne({
         _id: db.mongoId(id)
      }, function(err, t) {
         if (err) {
            return cb(err, {code: 142});
         }

         if (!t) {
            return cb(null, {code: 141});
         }

         var user = t.user;

         if (validUser(user)) {
            db.users.insert(user, function(err, newUser) {
               if (err) {
                  cb(err, {code: 142});
               } else {
                  cb(null, {
                     code: SUCCESS,
                     data: newUser && newUser[0]
                  });
               }
            });
         } else {
            cb(err, {code: 142});
         }
      });
   },

   confirmEmail: function(id, cb) {
      db.transactions.findOne({
         _id: db.mongoId(id)
      }, function(err, t) {
         if (err) {
            return cb(err, {code: 143});
         }

         if (!t) {
            return cb(null, {code: 141});
         }

         db.users.findOne({
            _id: db.mongoId(t.user),
         }, function(err, user) {
            if (err || !user) {
               return cb(err, {code: 143});
            }

            user.email = t.to;

            if ((user.type === 'local') ? !validUser(user) : !validRemoteUser(user)) {
               return cb(err, {code: 143});
            }

            db.users.save(user, function(err) {
               if (!err) {
                  return cb(err, {code: SUCCESS});
               }

               if (err.code === 11000) {
                  cb(null, {code: 144});
               } else {
                  cb(err, {code: 143});
               }
            });
         });
      });
   },

   recoverAccount: function(email, cb) {
      db.users.findOne({
         email: email,
         type: 'local'
      }, {
         _id: 1
      }, function(err, user) {
         if (err) {
            return cb(err, {code: 101});
         } 

         if (!user) {
            return cb(null, {code: 139});
         }

         db.transactions.insert({
            type: 'recovery',
            user: user._id
         }, function(err, t) {
            if (err || !t) {
               return cb(err, {code: 101});
            }

            mail.send({
               from: config.mail.defaultSender,
               to: email,
               subject: 'Password Reset',
               tmpl: {
                  name: 'mail/recover',
                  ctx: {
                     domain: config.domain,
                     id: t[0] && t[0]._id
                  }
               }
            }, function(err) {
               cb(err, {code: SUCCESS});
            });
         });
      });
   },

   resetPassword: function(user, password, cb) {
      db.users.findOne({
         _id: user
      }, function(err, user) {
         bcrypt.hash(password, config.hashStrength, function(err, hash) {
            if (err) {
               return cb(err, {code: 130});
            }

            user.password = hash;

            if (!validUser(user)) {
               return cb(null, {code: 137});
            }

            db.users.save(user, function(err) {
               cb(null, {code: SUCCESS});
            });
         });
      });
   }
};
