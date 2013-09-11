var firmata = require('firmata')
  , hardware = require('hardware');

var board = new firmata.Board('/dev/tty.usbmodem1421', function () {
  hardware.firmata(board);

  console.log("Starting up S17005...");
  var climate = require('../').connect('arduino', 2);

  climate.on('connected', function () {
    console.log("Connected to S17005");

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
});