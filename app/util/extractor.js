'use strict';

var config = require('r/config/settings');
var model = require('r/app/model');
var fs = require('fs');
var byline = require('byline');
var ent = require('ent');

var getInfo = function(title) {
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
      var extraction = new RegExp('<\\s*a[^>]+href=(?:\'|")(.*?)(?:\'|").*?>(.*?)<', 'i');
      var media = new RegExp('(' + config.mediaSites.join('|').replace(/\./g,'\\.') + ')', 'i');
      var report = {failed: [], succeeded: 0, filtered: 0, total: 0};

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
                   owner: opt.userId,
                   category: opt.category,
                   playCount: 0,
                   dateAdded: new Date()
                };

               model.linkDao.addLink(newLink, function(err, link) {
                  if (err) {
                     report.failed.push(newLink);
                  } else {
                     ++report.succeeded;
                  }
               });
            }
         } else {
            ++report.filtered;
         }
      });

      stream.on('error', function(err) {
         cb(err, null);
      });

      stream.on('end', function() {
         cb(null, report);
      });

   } catch(e) {
      cb(e, null);
   }
}
