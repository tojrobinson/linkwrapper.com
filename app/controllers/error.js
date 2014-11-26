'use strict';

module.exports = {
   notFound: function(req, res, err, next) {
      console.error(res.statusCode);
      res.send('not found', 404);
      next(err);
   },

   server: function(err, req, res, next) {
      console.error(err.stack);
      next(err);
      if (err.statusCode === 413) {
         res.send('file too large');
      }

      res.send('server error');
   }
};
