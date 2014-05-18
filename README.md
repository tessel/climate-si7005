# Climate

Driver for the climate-si7005 Tessel climate module ([Si7005](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)).

A port of [@jjalling's Si7005-B-GM Arduino library](https://github.com/jjalling/Arduino-Si7005) to JS.

##Installation
```sh
npm install climate-si7005
```
##Example
```js
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
```

## Methods

##### * `climate.getData(configVal, callback(err, data))` Get data from the sensor.

##### * `climate.readHumidity(callback(err, humidity))` Read and return the relative humidity.

##### * `climate.readTemperature(units, callback(err, temperature))` Read and return the temperature. Celsius by default, Fahrenheit if units === 'f'.

##### * `climate.setHeater(onOff, callback())` Accepts a boolean onOff (true for on) to turn the chip's internal heater on. This allows better humidity precision in high-humidity climates, but raises the temperature reading.

##### * `climate.setFastMeasure(onOff, callback())` Accepts a boolean onOff (true for fast mode, false for normal) to set polling to draw less power in exchange for lower resolution results. Most operations should just use normal mode.

    | Normal | Fast
--- | --- | ---
converstion time | 35ms | 18ms
temp resolution | 14 bit | 13 bit
humidity resolution | 12 bit | 11 bit

## Events

##### * `climate.on('error', callback(err))` Emitted when there is an error communicating with the module.

##### * `climate.on('ready', callback())` Emitted upon first successful communication between the Tessel and the module.

## Hardware overview/setup

The module may come with a protective white cover over the sensor, as shown in the image below. This cover is permeable and does *not* need to be removed before use. If the protective cover is removed, avoid touching, poking, or dirtying the exposed silicon die.

![Climate module with protective cover still in place](https://s3.amazonaws.com/technicalmachine-assets/doc+pictures/protective-cover.jpg)

## References

* [Arduino-Si7005](https://github.com/jjalling/Arduino-Si7005)
* [Si7005 datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)

## Licensing

MIT
APACHE
