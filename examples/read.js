var hardware = require('hardware');

console.log("Starting up S17005...");
var climate = require('../').connect(hardware.firmata('/dev/tty.usbmodem1411'), 2);

climate.on('connected', function () {
  console.log("Connected to S17005");

  // Better humidity readings.
  climate.setHeater(true);

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