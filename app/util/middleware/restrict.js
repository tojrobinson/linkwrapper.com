'use strict';

module.exports = function(req, res, next) {
   if (req.user) {
      next();
   } else {
      if (req.path.match(/^\/a/)) {
         res.json({
            type: 'error',
            msg: 'Your session has expired m8'
         });
      } else {
         res.redirect('/');
      }
   }
}
