// var hardware = require('hardware');
var tessel = require('tessel');

console.log("Starting up S17005...");
var climate = require('../').connect(tessel.port('A'));

climate.on('connected', function () {
  console.log("Connected to S17005");

  // Better humidity readings.
  // climate.setHeater(true);

  // Loop forever
  setImmediate(function loop () {
    climate.readTemperature('f', function (err, temp) {
      climate.readHumidity(function (err, humid) {
        console.log('Degrees:', temp.toFixed(4) + 'F', 'Humidity:', humid.toFixed(4) + '%RH');
        setTimeout(loop, 300);
      });
    });
  });
});