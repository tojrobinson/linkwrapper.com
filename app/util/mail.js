var config = require('r/config/settings');
var nodemailer = require('nodemailer');
var mail = nodemailer.createTransport('SMTP', config.mailService);

module.exports = mail;
