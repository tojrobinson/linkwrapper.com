'use strict';

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
            console.error(err.stack);
            res.render('index');
         }
      } else {
         next();
      }
   }
};
