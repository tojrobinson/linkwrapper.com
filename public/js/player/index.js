'use strict';

var UI = require('./views/static');
var model = require('./model');
var util = require('./util');
var ui = new UI();

model.init(ui);
util.init(ui.Notification);
