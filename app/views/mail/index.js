'use strict';

var fs = require('fs');
var path = require('path');
var dust = require('dustjs-linkedin');
var files = ['activate', 'updateEmail', 'recover'];

files.forEach(function(f) {
   fs.readFile(path.join(__dirname, 'emailified',  f + '.html'), function(err, raw) {
      if (err) {
         throw err;
      }

      var compiled = dust.compile(raw.toString(), 'mail/' + f);
      dust.loadSource(compiled);
   });
});

module.exports = dust.render;
