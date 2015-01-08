'use strict';

module.exports = function(req, res, next) {
   if (req.user && req.user.type) {
      res.redirect('/player');
   } else {
      next();
   }
}
