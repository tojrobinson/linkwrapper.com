'use strict';

var UI = require('./views/static');
var player = require('./model/player');
var library = require('./model/library');
var user = require('./model/user');
var util = require('./util');
var ui = new UI();

util.init(ui.Notification);
player.init(ui);
user.init(ui);
library.init(ui);
