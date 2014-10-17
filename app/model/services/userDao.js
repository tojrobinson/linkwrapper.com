'use strict';

var config = require('r/config/settings');
var db = require('r/app/util/db');
var validUser = require('r/app/model/user');
var BSON = require('mongodb').BSONPure;

module.exports = {
   getUser: function(criteria, done) {
      db.users.findOne(criteria, function(err, user) {
         if (err) {
            return done(err, user);
         } else if (!user) {
            return done(null, null);
         } else {
            return done(null, user);
         }
      });
   },

   getUserById: function(userId, done) {
      db.users.findOne({_id: new BSON.ObjectID(userId)}, function(err, user) {
         if (err) {
            return done(err, user);
         } else if (!user) {
            return done(null, null);
         } else {
            return done(null, user);
         }
      });
   },

   updateUser: function(userId, mod, done) {
      db.users.update(
         {_id: userId},
         mod,
         {upsert: false, multi: false},
         function(err) {
            if (err) {
               console.error(err);
               done(err);
            } else {
               done(null);
            }
         }
      );
   },

   handleRemoteUser: function(type, remoteUser, done) {
      var validTypes = config.loginMethods;

      if (validTypes.indexOf(type) < 0) {
         return done(null, false);
      }

      db.users.findOne({type: type, remote_id: remoteUser.id}, function(err, user) {
         if (err) {
            return done(err, user);
         } else if (!user) {
            var newUser = {
               first: remoteUser.first_name || remoteUser.given_name,
               last: remoteUser.last_name || remoteUser.family_name,
               email: remoteUser.email || '@.',
               type: type,
               remote_id: remoteUser.id,
               password: '',
               joined: new Date(),
               active: true,
               settings: {
                  theme: 'light'
               },
               lists: {
                  categories: [{name: 'Music', index: 'music'}],
                  playlists: []
               }
            };

            if (validUser(newUser)) {
               db.users.insert(newUser, {safe: true}, function(err, result) {
                  if (err) {
                     console.error(err);
                     return done(err, null);
                  } else {
                     return done(null, result[0]);
                  }
               });
            } else {
               return done(null, false);
            }
         } else {
            return done(err, user);
         }
      });
   },

   listUsers: function(criteria, done) {
      db.users.find(criteria).toArray(function(err, users) {
         if (err) {
            return done(err, users);
         } else if (!users) {
            return done(null, null);
         } else {
            return done(null, users);
         }
      });
   },

   addUser: function(newUser, done) {
      if (!validUser(newUser)) {
         return done({
            msg: 'Invalid user object.'
         });
      }

      if (newUser.type === 'local') {
         db.users.find({type: 'local', email: newUser.email}).count(function(err, count) {
            if (err) {
               done(err);
            } else if (count > 0) {
               done(null, false);
            } else {
               db.users.insert(newUser, {safe: true}, function(err, user) {
                  if (err) {
                     done(err);
                  } else {
                     done(null, user[0]);
                  }
               });
            }
         });
      } else {
         db.users.insert(newUser, {safe: true}, function(err, result) {
            if (err) {
               done(err);
            } else {
               done(null, result[0]);
            }
         });
      }
   },

   addCategory: function(userId, title, done) {
      db.users.findOne({_id: userId}, function(err, user) {
         if (err) {
            console.log(err);
            done(err);
         } else {
            var userCategories = user.lists.categories;

            // check title doesn't exist
            if (userCategories) {
               var c = title.toLowerCase();
               for (var i = 0; i < userCategories.length; ++i) {
                  if (c === userCategories[i].index) {
                     return done({msg: 'Category exists.'});
                  }
               }
            } else {
               return done({msg: 'Defective user object'});
            }

            userCategories.push({
               name: title,
               index: title.toLowerCase()
            })

            db.users.save(user, function(err) {
               if (err) {
                  console.error(err);
                  done(err);
               } else {
                  done(null);
               }
            });
         }
      });
   },

   removeCategory: function(userId, title, done) {
      db.users.findOne({_id: userId}, function(err, user) {
         if (err) {
            console.log(err);
            done(err);
         } else {
            var userCategories = user.lists.categories;

            // check title doesn't exist
            if (userCategories && (typeof title === 'string')) {
               title = title.toLowerCase();
               userCategories = userCategories.filter(function(c) {
                  if (c.index !== title) {
                     return c;
                  }
               });
               user.lists.categories = userCategories;
            } else {
               return done({msg: 'Invalid user object'});
            }

            db.users.save(user, function(err) {
               if (err) {
                  console.error(err);
                  done(err);
               } else {
                  done(null);
               }
            });
         }
      });
   },

   addPlaylist: function(userId, title, done) {
      db.users.findOne({_id: userId}, function(err, user) {
         if (err) {
            console.log(err);
            done(err);
         } else {
            var userPlayLists = user.lists.playlists;

            // check title doesn't exist
            if (userPlayLists) {
               var c = title.toLowerCase();
               for (var i = 0; i < userPlayLists.length; ++i) {
                  if (c === userPlayLists[i].index) {
                     return done({msg: 'Playlist exists.'});
                  }
               }
            } else {
               return done({msg: 'Defective user object'});
            }

            userPlayLists.push({
               name: title,
               index: title.toLowerCase(),
               links: []
            })

            db.users.save(user, function(err) {
               if (err) {
                  console.error(err);
                  done(err);
               } else {
                  done(null);
               }
            });
         }
      });
   }
};
