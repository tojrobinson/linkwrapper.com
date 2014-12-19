'use strict';

var parseLink = require('link-id');

function getInfo(title) {
   var parts = title.replace(/(?:^\W+|-\s*YouTube\s*$)/gi, '').split('-');
   if (parts.length > 1) {
      return {
         artist: parts[0].trim(),
            title: parts.slice(1).join('-').trim()
      };
   } else {
      return {
         artist: '',
            title: parts[0]
      };
   }
}

module.exports = function(opt, cb) {
   var extraction = new RegExp('href="(.*?)".*?>(.*?)<', 'i');
   var content = opt.content;
   var results = {
      found: 0,
      filtered: 0,
      links: []
   };

   if (!content || typeof content !== 'string') {
      return cb(null, results);
   }

   content.split('\n').forEach(function(line) {
      var details = extraction.exec(line);

      if (details) {
         var url = details[1];
         var info = getInfo(details[2]);
         var link = parseLink(url);
         results.found++;

         if (link && link.type in opt.types) {
            results.links.push({
               title: info.title,
               artist: info.artist,
               other: '',
               url: url
            });
         } else {
            results.filtered++;
         }
      }
   });

   cb(null, results);
}
