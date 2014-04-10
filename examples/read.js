// var hardware = require('hardware');
var tessel = require('tessel');

console.log("Starting up Si7005... on port bank A");
var climate = require('../').connect(tessel.port('A'));

climate.on('connected', function () {
  console.log("Connected to Si7005");

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