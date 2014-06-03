// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This basic example demonstrates how the 
climate module emits events for temperature. 
*********************************************/

var tessel = require('tessel');
var climatelib = require('../');

var climate = climatelib.use(tessel.port['A']);

// Emitted once readTemp gets data, allows other functions to listen for climate data
climate.on('temperature', function (temp, type) {
	console.log('Temperature data received: ', temp, 'degrees', type);
});

climate.on('ready', function () {
  console.log('Connected to si7005');
	climate.readTemperature('f', function (err, temp) {
		// Makes call to get temperature data
	});
});

climate.on('error', function(err) {
  console.log('error connecting module', err);
});
