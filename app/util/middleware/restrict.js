'use strict';

module.exports = function(req, res, next) {
   if (req.user) {
      next();
   } else {
      if (req.path.match(/^\/a/)) {
         res.send(401);
      } else {
         res.redirect('/');
      }
   }
}
