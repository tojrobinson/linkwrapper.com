'use strict';

exports.activeUser = function(req, res, next) {
   if (req.user) {
      res.redirect('/player');
   } else {
      next();
   }
}
