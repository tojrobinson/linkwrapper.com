var test = require('tape');
var extract = require('r/public/js/model/extractor');
var obj = require('r/test/obj');
var fs = require('fs');
var content = '';

test('setup', function(t) {
   fs.readFile(obj.bookmarks, 'utf8', function(err, blob) {
      t.error(err, 'reading bookmarks file');
      content = blob;
      t.end();
   });
});

test('Extract All', function(t) {
   t.plan(5);
   var found = 50;
   var filtered = 37;
   var links = 13;

   extract(content, function(err, result) {
      t.error(err);
      t.ok(result, 'result object ok');

      t.equal(result.found, found, 'find ' + found + ' links');
      t.equal(result.filtered, filtered, 'filter ' + filtered + ' links');
      t.equal(result.links.length, links, 'keep ' + links + ' links');
   });
});
