'use strict';

var fs = require('fs');
var byline = require('byline');
var ent = require('ent');

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

module.exports = function(file, opt, cb) {
   try {
      var stream = byline.createStream(fs.createReadStream(file, {encoding: 'utf8'}));
      var extraction = new RegExp('href="(.*?)".*?>(.*?)<', 'i');
      var type = new RegExp('(' + opt.sites.join('|').replace(/\./g,'\\.') + ')', 'i');
      var results = {
         found: 0,
         filtered: 0,
         links: []
      };

      stream.on('data', function(line) {
         line = ent.decode(line);
         var details = extraction.exec(line);

         if (details) {
            var url = details[1];
            var info = getInfo(details[2]);
            var mediaType = type.exec(url);
            results.found++;

            if (mediaType) {
               results.links.push({
                  mediaType: mediaType[1],
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

      stream.on('error', function(err) {
         cb(err, null);
      });

      stream.on('end', function() {
         cb(null, results);
      });

   } catch(e) {
      cb(e, null);
   }
}
