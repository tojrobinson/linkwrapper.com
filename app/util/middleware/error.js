'use strict';

var log = require('r/app/util/log');

module.exports = {
   notFound: function(req, res) {
      res.redirect('/');
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
         if (req.user) {
            res.json({
               type: 'error',
               msg: 'Oops! Some explosions happened : ('
            });
         } else {
            log.error({err: err, req: req}, 'uncaught exception');
            res.render('index');
         }
      } else {
         next();
      }
   }
};
