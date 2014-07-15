// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/******************************************************
This climate example takes data from two different
climate modules connected to the same physical port.
Like the basic example, it logs a stream of temperature
and humidity to the console.

Hardware setup:
You will need a way to selectively connect two modules.
We did this by soldering together the common pins (see
below) on a pair of stackable female headers and
running a cable made of male-to-female jumpers between
the Tessel and the soldered headers.

Connect the following pins on both modules to the same
pins on Tessel (solder bridged in our case):
 - GND
 - SCL
 - SDA
 - G1/TX (only needed for si7005 variants)

Connect G2/RX on Tessel to one module's 3.3V pin
Connect G3 on Tessel to the other module's 3.3V pin

Note:
The si7005 climate modules require that their G1/TX 
pin be tied low in order for them to function. As
such, connecting the G1/TX pin on the modules directly
to GND (instead of connecting them to the G1/TX pin
of the Tessel) frees up the G1/TX pin on the Tessel
so that yet another module can be controlled.

The si7020 variant does not have this requirement, so
G1/TX needn't be connected, freeing up the pin by
default.
******************************************************/

var tessel = require('tessel');
// If you're using a si7020 (TM-02-03),  replace this lib with climate-si7020
var climatelib = require('../');

// This works on any port
var port = tessel.port['A'];

// Because the climate module is so low power, we can run it off a GPIO
var state = false;
// ...But we need to multiplex them if we want to share the I2C bus
var one = port.digital[1].output(state);
var two = port.digital[2].output(!state);

setImmediate(function swap () {
  // Switch which module we power on
  state = !state;
  one.output(state);
  two.output(!state);

  setTimeout(function() {
    // Reinitialize the module
    climate = climatelib.use(port);
    climate.once('ready', function() {
      console.log('\nConnected to climate module #', (state ? '1' : '2'));
      climate.readTemperature('f', function (err, temp) {
        climate.readHumidity(function (err, humid) {
          console.log('Degrees:', temp.toFixed(4) + 'F', 'Humidity:', humid.toFixed(4) + '%RH');
          swap();
        });
      });
    });
  }, 1000);
});
