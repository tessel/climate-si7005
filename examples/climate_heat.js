var tessel = require('tessel');
var climatelib = require('../');

var climate = climatelib.use(tessel.port['A']);