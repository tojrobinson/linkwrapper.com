'use strict';

module.exports = function(req, res, next) {
   if (req.user) {
      res.redirect('/player');
   } else {
      next();
   }
}
