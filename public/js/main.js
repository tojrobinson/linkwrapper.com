'use strict';

var UI = require('./views/static');
var player = require('./model/player');
var library = require('./model/library');
var ui = new UI();

player.init(ui);
library.init(ui);
library.loadList();
