#Climate
Driver for the climate-si7005 Tessel climate module. The hardware documentation for this module can be found [here](https://github.com/tessel/hardware/blob/master/modules-overview.md#climate).

A port of [@jjalling's Si7005-B-GM Arduino library]( https://github.com/jjalling/Arduino-Si7005 ) to JS.

If you run into any issues you can ask for support on the [Climate Module Forums](http://forums.tessel.io/category/climate).


### Hardware overview/setup
The module may come with a protective white cover over the sensor, as shown in the image below. This cover is permeable and does *not* need to be removed before use. If the protective cover is removed, avoid touching, poking, or dirtying the exposed silicon die.

![Climate module with protective cover still in place]( https://s3.amazonaws.com/technicalmachine-assets/doc+pictures/protective-cover.jpg )

There are multiple versions of this module. In the picture above, you can see that it says "climate-si7005", but yours may say something different, like "climate-si7020". In that case, you need to use "climate-si7020" in places where these docs say "climate-si7005".

### Installation
```sh

npm install climate-si7005

# If your module says `climate-si7020` on it, `npm install` that instead:
# npm install climate-si7020

```

### Example
```js
/*********************************************
This basic climate example logs a stream
of temperature and humidity to the console.
*********************************************/

var tessel = require('tessel');

// !!! Change this to require('climate-si7020') if that's what's written on your module.
var climatelib = require('climate-si7005');

var climate = climatelib.use(tessel.port['A']);

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

### Methods

&#x20;<a href="#api-climate-use-interface-csn-Takes-in-the-port-bank-that-the-module-is-connected-to-Returns-the-Climate-object" name="api-climate-use-interface-csn-Takes-in-the-port-bank-that-the-module-is-connected-to-Returns-the-Climate-object">#</a> climate<b>.use</b> ( interface[, csn] ) Takes in the port bank that the module is connected to. Returns the Climate object.  

&#x20;<a href="#api-climate-readTemperature-format-callback-err-temp" name="api-climate-readTemperature-format-callback-err-temp">#</a> climate<b>.readTemperature</b> ( [format,] callback(err, temp) )  
Returns the temperature in degrees Celcius or Fahrenheit.

&#x20;<a href="#api-climate-readHumidity-callback-err-humidity" name="api-climate-readHumidity-callback-err-humidity">#</a> climate<b>.readHumidity</b> ( callback(err, humidity) )  
Returns the relative humidity.

&#x20;<a href="#api-climate-setHeater-bool-callback-err-Sets-the-HEAT-config-register" name="api-climate-setHeater-bool-callback-err-Sets-the-HEAT-config-register">#</a> climate<b>.setHeater</b> ( bool[, callback(err)] )  

Sets the HEAT config register. The heater evaporates any moisture that may have condensed on the sensor in high humidty environments. Enabling the heater will increase the accuracy of humidity measurements but will interfere with temperature measurement.

>According to section 5.1.4 of the [datasheet]( http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf )
Turning on the heater will reduce the tendency of the humidity sensor to accumulate an offset due to “memory” of sustained high humidity conditions. When the heater is enabled, the reading of the on-chip temperature sensor will be affected (increased).

&#x20;<a href="#api-climate-setFastMeasure-bool-callback-err-Sets-the-FAST-config-register" name="api-climate-setFastMeasure-bool-callback-err-Sets-the-FAST-config-register">#</a> climate<b>.setFastMeasure</b> ( bool[, callback(err)] )  
Sets the FAST config register.   
>According to section 5.1.3 of the [datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf )
	Fast mode reduces the total power consumed during a conversion or the average power consumed by the Si7005 when making periodic conversions. It also reduces the resolution of the measurements.

| Normal | Fast
--- | --- | ---
converstion time | 35ms | 18ms
temp resolution | 14 bit | 13 bit
humidity resolution | 12 bit | 11 bit

### Events
&#x20;<a href="#api-climate-on-ready-Emitted-when-upon-first-successful-communication-between-the-Tessel-and-the-module" name="api-climate-on-ready-Emitted-when-upon-first-successful-communication-between-the-Tessel-and-the-module">#</a> climate<b>.on</b> ( 'ready' )  
Emitted when upon first successful communication between the Tessel and the module.  

&#x20;<a href="#api-climate-on-temperature-callback-temp_type-Emitted-when-temperature-data-is-received-Internal-to-the-readTeperature-method-useful-when-another-module-is-triggered-by-climate-data" name="api-climate-on-temperature-callback-temp_type-Emitted-when-temperature-data-is-received-Internal-to-the-readTeperature-method-useful-when-another-module-is-triggered-by-climate-data">#</a> climate<b>.on</b> ( 'temperature'[,callback(temperature, temp_type)] )  
Emitted when temperature data is received. Internal to the readTemperature method, useful when another module is triggered by climate data.  

&#x20;<a href="#api-climate-on-humidity-callback-humidity-Emitted-when-humidity-data-is-received-Internal-to-the-readHumidity-method-useful-when-another-module-is-triggered-by-climate-data" name="api-climate-on-humidity-callback-humidity-Emitted-when-humidity-data-is-received-Internal-to-the-readHumidity-method-useful-when-another-module-is-triggered-by-climate-data">#</a> climate<b>.on</b> ( 'humidity'[,callback(humidity)] )  
Emitted when humidity data is received. Internal to the readHumidity method, useful when another module is triggered by climate data.  

###Further Examples  
* [Climate Events](https://github.com/tessel/climate-si7005/blob/master/examples/climate_events.js). This basic example demonstrates how the climate module emits events for temperature.
* [Climate Heater](https://github.com/tessel/climate-si7005/blob/master/examples/climate_heat.js). This example demonstates the climate module's built in heater and how it effects temperature and humidity readings. 

### References
* [Arduino-Si7005](https://github.com/jjalling/Arduino-Si7005)

* [Si7005 datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)

### License
MIT or Apache 2.0, at your option
