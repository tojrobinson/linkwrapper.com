var m = require('r/app/util/middleware');

module.exports = function(app) {
   app.use(m.error.notFound);
   app.use(m.error.tooLarge);
   app.use(m.error.server);
}
