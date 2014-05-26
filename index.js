// Copyright 2014 Technical Machine, Inc. See the COPYRIGHT
// file at the top-level directory of this distribution.
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

var events = require('events');
var util = require('util');

// Configuration
// Datasheet: http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf

var
  REG_STATUS = 0x00,
  REG_DATA = 0x01,
  REG_CONFIG = 0x03,
  REG_ID = 0x11,

  // Status register
  STATUS_NOT_READY = 0x01,

  // Config register
  CONFIG_START = 0x01,
  CONFIG_HEAT = 0x02,
  CONFIG_HUMIDITY = 0x00,
  CONFIG_TEMPERATURE = 0x10,
  CONFIG_FAST = 0x20,

  // ID register
  ID_SAMPLE = 0xF0,
  ID_SI7005 = 0x50,

  // Coefficients
  TEMPERATURE_OFFSET = 50,
  TEMPERATURE_SLOPE = 32,
  HUMIDITY_OFFSET = 24,
  HUMIDITY_SLOPE = 16,
  a0  = (-4.7844),
  a1  =  0.4008,
  a2  = (-0.00393),
  q0   = 0.1973,
  q1   = 0.00237,

  WAKE_UP_TIME  = 15,

  // Constants
  I2C_ADDRESS = 0x40,
  DATAh = 0x01, // Relative Humidity or Temperature, High Byte
  DATAl = 0x02; // Relative Humidity or Temperature, Low Byte


// Constructor
function Climate (hardware) {
  this.hardware = hardware;
  this.csn = 1;
  this._configReg = 0;

  // I2C object for address
  this.i2c = this.hardware.I2C(I2C_ADDRESS);

  this.hardware.digital[this.csn].write(0);

  var self = this;

  setTimeout(function () {
    self._readRegister(REG_ID, function ok (err, reg) {
      var id = reg & ID_SAMPLE;
      if (id != ID_SI7005) {
        self.emit('error', new Error('Cannot connect to climate sensor. Got id: ' + id.toString(16)));
      }
      else {
        self.emit('ready');
      }
    });
  }, WAKE_UP_TIME);
}

util.inherits(Climate, events.EventEmitter);

// Read from registers on the PCA9685 via I2C
Climate.prototype._readRegister = function (addressToRead, callback) {
  /*
  Args
    addressToRead
      Register to read
    callback
      Callback; gets reply byte as its arg
  */
  this.i2c.transfer(new Buffer([addressToRead]), 1, function (err, ret) {
    if (callback) {
      callback(err, ret && ret[0]);
    }
  });
};

// Write to registers on the PCA9685 via I2C
Climate.prototype._writeRegister = function (addressToWrite, dataToWrite, callback) {
  /*
  Args
    addressToWrite
      Register to read
    dataToWrite
      Bytes to send
    callback
      Callback
  */
  this.i2c.send(new Buffer([addressToWrite, dataToWrite]), callback);
};

// Get data from the sensor. Effectively a wrapper function.
Climate.prototype.getData = function (configValue, callback) {
  /*
  Args
    configValue
      Value corresponding to what data is being requested
    callback
      Callback; gets err, data as args
  */
  //  Pull the cs line low
  this.hardware.digital[this.csn].write(0);

  //  Wait until the chip wakes up
  var self = this;
  setTimeout(function () {
    self._writeRegister(REG_CONFIG, CONFIG_START | configValue | self._configReg, function () {
      setImmediate(function untilready () {
        self._readRegister(REG_STATUS, function (err, status) {
          if (status & STATUS_NOT_READY) {
            setImmediate(untilready);
            return;
          }

          self._writeRegister(REG_DATA, 0, function () {
            self._readRegister(DATAh, function (err, datah) {
              self._readRegister(DATAl, function (err, datal) {

                self.hardware.digitalWrite(self.csn, 1);
                callback(null, datal | datah << 8);
              });
            });
          });
        });
      });
    });
  }, WAKE_UP_TIME);
};

// Read and return the relative humidity
Climate.prototype.readHumidity = function (callback) {
  /*
  Args
    callback
      Callback; gets err, relHumidity as args
  */
  var self = this;
  this.getData(CONFIG_HUMIDITY, function (err, reg) {
    var rawHumidity = reg >> 4;
    var curve = ( rawHumidity / HUMIDITY_SLOPE ) - HUMIDITY_OFFSET;
    var linearHumidity = curve - ( (curve * curve) * a2 + curve * a1 + a0);
    linearHumidity = linearHumidity + ( self._lastTemperature - 30 ) * ( linearHumidity * q1 + q0 );

    if (callback) {
      callback(null, linearHumidity);
    }
  });
};

// Read and return the temperature. Celsius by default, Fahrenheit if type === 'f'
Climate.prototype.readTemperature = function (/*optional*/ units, callback) {
  /*
  Args
    units
      if units === 'f', use Fahrenheit
    callback
      Callback; gets err, temperature as args
  */
  callback = callback || type;

  var self = this;
  this.getData(CONFIG_TEMPERATURE, function (err, reg) {
    // console.log('Temp regs:', reg);
    var rawTemperature = reg >> 2;
    var temp = ( rawTemperature / TEMPERATURE_SLOPE ) - TEMPERATURE_OFFSET;
    self._lastTemperature = temp;

    if (units.toLowerCase() === 'f') {
      temp = temp * (9/5) + 32;
    }

    callback(null, temp);
  });
};

// Turn the chip's internal heater on or off (make humidity more accurate, temperature less accurate)
Climate.prototype.setHeater = function (status, callback) {
  /*
  Turn the chip's internal heater on or off. Enabling the heater will drive
  condensation off of the sensor, thereby reducing its hysteresis and allowing
  for more accurate humidity measurements in high humidity conditions.

  According to section 5.1.4 of the [datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)
  > Turning on the heater will reduce the tendency of the humidity sensor to accumulate an offset due to “memory” of sustained high humidity conditions. When the heater is enabled, the reading of the on-chip temperature sensor will be affected (increased).

  Note that this will interfere with (raise) temperature measurement.

  Args
    status
      true = heater on, false = heater off
  */
  if (status) {
    this._configReg |= CONFIG_HEAT;
  } else {
    this._configReg ^= CONFIG_HEAT;
  }

  if (callback) {
    callback();
  }
};

// Save some power by lowering resolution of results
Climate.prototype.setFastMeasure = function  (status, callback) {
  /*
  Draw less power on successive polling at the cost of resolution.
  Note that this module already uses very little power.

  Sets the FAST config register. According to section 5.1.3 of the [datasheet](http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf)
  > Fast mode reduces the total power consumed during a conversion or the average power consumed by the Si7005 when making periodic conversions. It also reduces the resolution of the measurements.

      | Normal | Fast
  --- | --- | ---
  converstion time | 35ms | 18ms
  temp resolution | 14 bit | 13 bit
  humidity resolution | 12 bit | 11 bit

  Args
    status
      true = fast mode, false = normal mode
  */
  if (status) {
    this._configReg |= CONFIG_FAST;
  } else {
    this._configReg ^= CONFIG_FAST;
  }

  if (callback) {
    callback();
  }
};

function use (hardware, csn) {
  return new Climate(hardware, csn);
}

exports.Climate = Climate;
exports.use = use;
