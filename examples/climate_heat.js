// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This example demonstates the climate module's
built in heater and how it effects temperature
amd humidity readings.
*********************************************/

var tessel = require('tessel');
var climatelib = require('../');

var climate = climatelib.use(tessel.port['A']);

climate.on('ready', function () {
	console.log('Connected to si7005');

	// Set up variables
	var init_temp = 0;
	var init_humid = 0;
	var current_temp = 0;
	var current_humid = 0;
	var change_temp = 0;
	var change_humid = 0;
	var seconds_passed = 0;
	var seconds = 0;


	// Read temp, set initial temperature value
	climate.readTemperature('f', function initial_temp (err, temp) {
		init_temp = temp;
		current_temp = temp;
		console.log('Your inital temperature is:', temp);
	})

	// Wait for the humidity module to get an accurate first reading.
	setTimeout(function wait_for_humid () {
	// Read humidity, set initial humidity value
	climate.readHumidity(function initial_humid (err, humid) {
		init_humid = humid;
		current_humid = humid;
		console.log('Your inital humidity is:', humid);
	});

	// Turn on heater
	climate.setHeater(true);

	// Loop temperature and humidity readings as heater warms up, get readings every 5 seconds
  setImmediate(function loop () {
    climate.readTemperature('f', function (err, temp) {
      climate.readHumidity(function (err, humid) {
      	seconds = seconds_passed/1000;
      	change_temp = current_temp - init_temp;
      	change_humid = current_humid - init_humid;
        console.log('Degrees:', temp.toFixed(4) + 'F', 'Humidity:', humid.toFixed(4) + '%RH');
        console.log('Data has changed', change_temp, 'degrees and', change_humid, '%RH over the last', seconds ,'seconds.');
        current_temp = temp;
        current_humid = humid;
        seconds_passed += 5000;
        setTimeout(loop, 5000);
      });
    });
  });
  }, 5000);
});
