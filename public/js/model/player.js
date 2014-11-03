'use strict';

var manager = require('./manager');
var sites = require('./sites');
var linkId = require('link-id');

manager.setContainer('player');
manager.use(new sites.YouTube('youtube'));

function play() {
   // TODO
};

module.exports = play;
