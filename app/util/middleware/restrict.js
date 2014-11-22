'use strict';

module.exports = function(req, res, next) {
   if (req.user) {
      next();
   } else {
      if (req.path.match(/async/)) {
         res.render('notifications/loadError', {
            statusCode: 401, message: 'Your session has expired. Please login to load this resource.'
         });
      } else {
         res.redirect('/');
      }
   }
}
