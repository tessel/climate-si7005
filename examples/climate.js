/*********************************************
This basic climate example logs a stream
of temperature and humidity to the console.
*********************************************/

var tessel = require('tessel');

console.log('Starting up si7005... on port bank A');
var climate = require('../').use(tessel.port('A'));

climate.on('ready', function () {
  console.log('Connected to si7005');

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

climate.on('error', function(err) {
  console.log('error connecting module', err);
});
setInterval(function(){}, 20000);
