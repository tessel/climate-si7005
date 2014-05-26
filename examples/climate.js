// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This basic climate example logs a stream
of temperature and humidity to the console.
*********************************************/

var tessel = require('tessel');
var climate = require('../').use(tessel.port['A']); // Replace '../' with 'climate-si7005' in your own code

// Wait for the climate module to connect
climate.on('ready', function () {
  // Loop forever
  setImmediate(function loop () {
    // Get temperature in Fahrenheit
    climate.readTemperature('f', function (err, temp) {
      // Get humidity in % relative humidity (http://en.wikipedia.org/wiki/Relative_humidity)
      climate.readHumidity(function (err, humid) {
        // Print temperature and humidity to the console
        console.log('Degrees:', temp.toFixed(4) + 'F', 'Humidity:', humid.toFixed(4) + '%RH');
        setTimeout(loop, 300); // Repeat every 300ms
      });
    });
  });
});

// If there is an error, log it
climate.on('error', function(err) {
  console.log('error connecting module', err);
});

// Keep the process open
setInterval(function(){}, 20000);
