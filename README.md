#Climate
Driver for the climate-s17005 Tessel climate module ([SI7005](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)).

A port of [@jjalling's Si7005-B-GM Arduino library](https://github.com/jjalling/Arduino-Si7005) to JS.

##Really Important Information
e.g. "this isn't ready to go yet" or "here is some special way you have to use this or it won't work"
Hopefully we don't need this section by the time we release things to the public

##Installation
```sh
npm install relay-im48dgr
```
##Example
```js
var climate = require('climate-s17005').connect(hardwareapi);
climate.on('connected', function () {
  climate.readTemperature('f', function (err, temp) {
    console.log('Degrees:', temp.toFixed(4) + 'F');
  });
});
```

##Methods

*  **`relay`.connect(interface[, csn])**
Takes in the port bank that the module is connected to. Returns the Temp/Humid object.

*  **`relay`.readTemperature([format,] callback(err, temp))**
Returns the temperature in degrees Celcius or Fahrenheit.

*  **`relay`.readHumidity(callback(err, humidity))** Returns the humidity level.

*  **`relay`.setHeater(bool[, callback(err)])** Sets the HEAT config register. According to section 5.1.4 of the [datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)
> Turning on the heater will reduce the tendency of the humidity sensor to accumulate an offset due to “memory” of sustained high humidity conditions. When the heater is enabled, the reading of the on-chip temperature sensor will be affected (increased).

*  **`relay`.setFastMeasure(bool[, callback(err)])** Sets the FAST config register. According to section 5.1.3 of the [datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)
> Fast mode reduces the total power consumed during a conversion or the average power consumed by the Si7005 when making periodic conversions. It also reduces the resolution of the measurements.

 | Normal | Fast
--- | --- | ---
converstion time | 35ms | 18ms
temp resolution | 14 bit | 13 bit
humidity resolution | 12 bit | 11 bit

##References
* [Arduino-Si7005](https://github.com/jjalling/Arduino-Si7005)
* [Si7005 datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)

## License

MIT
