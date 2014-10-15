var ElementManager = require('elman');
var em = new ElementManager;

module.exports = {
   addLink: function(link, cb) {
      $.ajax({
         type: 'post',
         url: '/async/addLink',
         data: link,
         complete: function(data) {
            if (!data || data.responseText === 'failure') {
               cb(false);
            } else {
               cb(data.responseText);
               em.mutated();
            }
         }
      });
   }
};
