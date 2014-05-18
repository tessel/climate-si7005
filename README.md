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

* **`climate`.connect(interface[, csn])**
Takes in the port bank that the module is connected to. Returns the Climate object.

*  **`climate`.readTemperature([format,] callback(err, temp))**
Returns the temperature in degrees Celcius or Fahrenheit.

*  **`climate`.readHumidity(callback(err, humidity))** Returns the relative humidity.

*  **`climate`.setHeater(bool[, callback(err)])** Sets the HEAT config register.
The heater evaporates off any moisture that may condense on the sensor in high humidty environments. Enabling the heater will inreases the accuracy of humidity measurements but will interfere with temperature measurement.
According to section 5.1.4 of the [datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)
> Turning on the heater will reduce the tendency of the humidity sensor to accumulate an offset due to “memory” of sustained high humidity conditions. When the heater is enabled, the reading of the on-chip temperature sensor will be affected (increased).


*  **`climate`.setFastMeasure(bool[, callback(err)])** Sets the FAST config register. According to section 5.1.3 of the [datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)
> Fast mode reduces the total power consumed during a conversion or the average power consumed by the Si7005 when making periodic conversions. It also reduces the resolution of the measurements.

    | Normal | Fast
--- | --- | ---
converstion time | 35ms | 18ms
temp resolution | 14 bit | 13 bit
humidity resolution | 12 bit | 11 bit


## Events

## Hardware overview/setup

The module may come with a protective white cover over the sensor, as shown in the image below. This cover is permeable and does *not* need to be removed before use. If the protective cover is removed, avoid touching, poking, or dirtying the exposed silicon die.

![Climate module with protective cover still in place](https://s3.amazonaws.com/technicalmachine-assets/doc+pictures/protective-cover.jpg)

## References

* [Arduino-Si7005](https://github.com/jjalling/Arduino-Si7005)
* [Si7005 datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)

## Licensing

MIT
APACHE
