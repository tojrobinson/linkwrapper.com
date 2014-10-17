'use strict';

var config = require('r/config/settings');
var model = require('r/app/model');
var fs = require('fs');
var byline = require('byline');
var ent = require('ent');

var getInfo = function(title) {
   var parts = title.replace(/(?:^\W+|-\s*YouTube\s*$)/gi, '').split('-');
   if (parts.length > 1) {
      return {artist: parts[0].trim(), title: parts.slice(1).join('-').trim()};
   } else {
      return {artist: '', title: parts[0]};
   }
}

module.exports = function(file, options, done) {
   try {
      var stream = byline.createStream(fs.createReadStream(file, {encoding: 'utf8'})),
          extraction = new RegExp('<\\s*a[^>]+href=(?:\'|")(.*?)(?:\'|").*?>(.*?)<', 'i'),
          media = new RegExp('(' + config.mediaSites.join('|').replace(/\./g,'\\.') + ')', 'i'),
          report = {failed: [], succeeded: [], filtered: 0, total: 0};

      stream.on('data', function(line) {
         var site = media.exec(line);
         line = ent.decode(line);
         report.total++;

         if (site) {
            var details = extraction.exec(line);

            if (details) {
               var url = details[1];
               var info = getInfo(details[2]);
               var mediaType = site[1];
               var newLink = {
                   mediaType: mediaType,
                   title: info.title,
                   artist: info.artist,
                   other: '',
                   url: url,
                   owner: options.userId,
                   category: options.category,
                   playCount: 0,
                   dateAdded: new Date()
                };

               model.linkDao.addLink(newLink, function(err, link) {
                  if (err) {
                     report.failed.push(newLink);
                  } else if (link) {
                     report.succeeded.push(newLink)
                  }
               });
            }
         } else {
            ++report.filtered;
         }
      });

      stream.on('error', function(err) {
         done(err);
      });

      stream.on('end', function() {
         done(null, report);
      });

   } catch(e) {
      done(e);
   }
}
