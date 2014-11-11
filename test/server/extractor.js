var test = require('tape');
var extract = require('r/app/util/extractor');

test('Extract All', function(t) {
   t.plan(5);
   var found = 50;
   var filtered = 37;
   var links = 13;

   extract('../obj/bookmarks.html', {
      sites: ['youtube.com', 'vimeo.com', 'soundcloud.com']
   }, function(err, result) {
      t.error(err);
      t.ok(result, 'result object ok');

      t.equal(result.found, found, 'find ' + found + ' links');
      t.equal(result.filtered, filtered, 'filter ' + filtered + ' links');
      t.equal(result.links.length, links, 'keep ' + links + ' links');
   });
});

test('Extract YouTube', function(t) {
   t.plan(5);
   var found = 50;
   var filtered = 39;
   var links = 11;

   extract('../obj/bookmarks.html', {
      sites: ['youtube.com']
   }, function(err, result) {
      t.error(err);
      t.ok(result, 'result object ok');

      t.equal(result.found, found, 'find ' + found + ' links');
      t.equal(result.filtered, filtered, 'filter ' + filtered + ' links');
      t.equal(result.links.length, links, 'keep ' + links + ' links');
   });
});
