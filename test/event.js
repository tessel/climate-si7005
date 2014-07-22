// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/* test rig */
function tap (max) { tap.t = 1; console.log(tap.t + '..' + max); };
function ok (a, d) { console.log(a ? 'ok ' + (tap.t++) + ' -' : 'not ok ' + (tap.t++) + ' -', d); }

tap(1);

var tessel = require('tessel');
var climatelib = require('../');

var port = process.argv[2] || 'A';
var climate = climatelib.use(tessel.port[port]);

climate.on('ready', function () {
	ok(true, 'ready event was fired.');
});
