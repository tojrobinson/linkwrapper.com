var fs = require('fs');
var path = require('path');
var premailer = require('premailer-api');
var css = fs.readFileSync('mail.css', 'utf8');
var dir = path.join(__dirname, 'emailified');

process.argv.splice(0,2);

if (!process.argv.length) {
   console.log('Must supply email template file names');
   process.exit(1);
}

process.argv.forEach(function(file) {
   var html = fs.readFileSync(file, 'utf8');
   html = html.replace(/\n|<link.*?>/g, '')
              .replace(/<\/html>/, '<style>' + css + '</style></html>');

   if (html && css) {
      premailer.prepare({
         html: html + '<style>'+ css + '</style></html>',
         preserveStyles: false
      }, function(err, email) {
         email = email
                 .html
                 .replace(/\n/g, '')
                 .replace(/%7B/gi, '{')
                 .replace(/%7D/gi, '}')
                 .replace(/&amp;/gi, '&');

         if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
         }

         fs.writeFile(path.join(dir, file), email, function(err) {
            if (err) {
               throw err;
            }

            console.log('Emailified ' + file);
         });
      });
   }
});
