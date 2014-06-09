var test = require('tape');
var tessel = require('tessel');
var climatelib = require('../');

test('events', function (t) {
	t.plan(2);

	var climate = climatelib.use(tessel.port['A']);

	climate.on('ready', function () {
		t.equal();
		t.notEqual();
	});
});