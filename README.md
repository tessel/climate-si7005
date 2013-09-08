#Temp-humid-s17005
A port of [@jjalling's Si7005-B-GM Arduino library](https://github.com/jjalling/Arduino-Si7005) to JS

##Example
```js
var temphum = require('temp-humid-s17005');
temphum.initialize('A'); // pick out the port bank
console.log(temphum.get_temp());
```

##Method calls

###.initialize(port_bank)

Takes in the port bank that the module is connected to. Returns the Temp/Humid object.

###.get_temp()

Returns the temperature in degrees Celcius.

###.get_temp_fahrenheit()

Returns the temperature in degrees Fahrenheit.

###.get_humidity()

Returns the humidity level.

###.set_heater(ENABLE | DISABLE)

Sets the HEAT config register. According to section 5.1.4 of the datasheet

> Turning on the heater will reduce the tendency of the humidity sensor to accumulate an offset due to “memory” of sustained high humidity conditions. When the heater is enabled, the reading of the on-chip temperature sensor will be affected (increased).

###.set_fast_measure(ENABLE | DISABLE)

Sets the FAST config register. According to section 5.1.3 of the datasheet

> Fast mode reduces the total power consumed during a conversion or the average power consumed by the Si7005 when making periodic conversions. It also reduces the resolution of the measurements.

 | Normal | Fast
--- | --- | ---
converstion time | 35ms | 18ms
temp resolution | 14 bit | 13 bit
humidity resolution | 12 bit | 11 bit


##References
* [Arduino-Si7005](https://github.com/jjalling/Arduino-Si7005)
* [Si7005 datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)
