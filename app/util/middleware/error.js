'use strict';

var log = require('r/app/util/log');

module.exports = {
   notFound: function(req, res, next) {
      res.status(404);
      res.render('error', {
         msg: '<strong>404.</strong> The requested URL was not found on this server.'
      });
   },

   tooLarge: function(err, req, res, next) {
      if (err && err.statusCode === 413) {
         res.json({
            type: 'error',
            msg: 'Unable to process request. Request too large.'
         });
      } else {
         next(err);
      }
   },

   server: function(err, req, res, next) {
      if (err) {
         log.error({err: err, req: req}, 'uncaught exception');

         if (req.user) {
            res.json({
               type: 'error',
               msg: 'Oops! Some explosions happened : ('
            });
         } else {
            res.render('index');
         }
      } else {
         next();
      }
   }
};
