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
var prom = require('prom');

/**
 * Configuration
 */

// Datasheet: http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf

var
  REG_STATUS = 0x00,
  REG_DATA = 0x01,
  REG_CONFIG = 0x03,
  REG_ID = 0x11,

/* Status Register */
  STATUS_NOT_READY = 0x01,

/* Config Register */
  CONFIG_START = 0x01,
  CONFIG_HEAT = 0x02,
  CONFIG_HUMIDITY = 0x00,
  CONFIG_TEMPERATURE = 0x10,
  CONFIG_FAST = 0x20,

/* ID Register */
  ID_SAMPLE = 0xF0,
  ID_SI7005 = 0x50,

/* Coefficients */
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

/* Constants */
  I2C_ADDRESS = 0x40,
  DATAh = 0x01, // Relative Humidity or Temperature, High Byte
  DATAl = 0x02; // Relative Humidity or Temperature, Low Byte

/**
 * ClimateSensor
 */

function ClimateSensor (hardware, csn) {
  /**
  Constructor

  Args
    hardware
      Tessel port to use
    csn
      Chip select pin to use (active low). Wired to GPIO 1 on the module.
  */

  this.onReady = prom(); // An promise that will be delivered on 'ready' event

  this.hardware = hardware;
  this.csn = csn || 0;
  this._configReg = 0;

  // I2C object for address
  this.i2c = this.hardware.I2C(I2C_ADDRESS);

  this.hardware.digital[this.csn].write(0);

  var self = this;

  setTimeout(function () {
    self._readRegister(REG_ID, function ok (err, reg) {
      var id = reg & ID_SAMPLE;
      if (id != ID_SI7005) {
        self.emit('error', new Error('Cannot connect to Si7005. Got id: ' + id.toString(16)));
      }
      else {
        self.emit('ready');
        self.onReady.deliver('delivered request'); // Delviers promise when module is ready 
      }
    });
  }, WAKE_UP_TIME);
}

util.inherits(ClimateSensor, events.EventEmitter);

ClimateSensor.prototype._readRegister = function (addressToRead, next) {
  /**
  Read from registers on the Si7005 via I2C

  Args
    addressToRead
      Register to read
    next
      Callback; gets reply byte as its arg
  */
  this.i2c.transfer(new Buffer([addressToRead]), 1, function (err, ret) {
    if (next) {
      next(err, ret && ret[0]);
    }
  });
};

ClimateSensor.prototype._writeRegister = function (addressToWrite, dataToWrite, next) {
  /**
  Write to registers on the Si7005 via I2C

  Args
    addressToWrite
      Register to read
    dataToWrite
      Bytes to send
    next
      Callback
  */
  this.i2c.send(new Buffer([addressToWrite, dataToWrite]), next);
};

ClimateSensor.prototype.getData = function (configValue, next) {
  /**
  Get data from the sensor. Effectively a wrapper function.

  Args
    configValue
      Value corresponding to what data is being requested
    next
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
                next(null, datal | datah << 8);
              });
            });
          });
        });
      });
    });
  }, WAKE_UP_TIME);
};

ClimateSensor.prototype.readHumidity = function (next) {
  /**
  Read and return the relative humidity

  Args
    next
      Callback; gets err, relHumidity as args
  */
  var self = this;
  self.onReady(function () {
    self.getData(CONFIG_HUMIDITY, function (err, reg) {
      var rawHumidity = reg >> 4;
      var curve = ( rawHumidity / HUMIDITY_SLOPE ) - HUMIDITY_OFFSET;
      var linearHumidity = curve - ( (curve * curve) * a2 + curve * a1 + a0);
      linearHumidity = linearHumidity + ( self._lastTemperature - 30 ) * ( linearHumidity * q1 + q0 );

      self.emit('humidity', linearHumidity);
      
      if (next) {
        next(null, linearHumidity);
      }
    })
  });
};

ClimateSensor.prototype.readTemperature = function (/*optional*/ type, next) {
  /**
  Read and return the temperature. Celcius by default, Farenheit if type === 'f'

  Args
    type
      if type === 'f', use Farenheit
    next
      Callback; gets err, temperature as args
  */
  next = next || type;

  var self = this;
  self.onReady( function () {
    self.getData(CONFIG_TEMPERATURE, function (err, reg) {
      // console.log('Temp regs:', reg);
      var rawTemperature = reg >> 2;
      var temp = ( rawTemperature / TEMPERATURE_SLOPE ) - TEMPERATURE_OFFSET;
      self._lastTemperature = temp;

      if (type === 'f') {
        temp = temp * (9/5) + 32;
      }

      self.emit('temperature', temp, type);

      next(null, temp);
    })
  });
};

ClimateSensor.prototype.setHeater = function (status) {
  /**
  Turn the chip's internal heater on or off. Enabling the heater will drive
  condensation off of the sensor, thereby reducing its hysteresis and allowing
  for more accurate humidity measurements in high humidity conditions.

  Note that this will interfere with (raise) temperature mesurement.

  Args
    status
      true = heater on, false = heater off
  */
  if (status) {
    this._configReg |= CONFIG_HEAT;
  } else {
    if (this._configReg)
    {
      this._configReg &= ~CONFIG_HEAT;
    }
  }
};

ClimateSensor.prototype.setFastMeasure = function  (status) {
  /**
  Draw less power on successive polling at the cost of resolution.
  Note that this module already uses very little power.

  Args
    status
      true = fast mode, false = normal mode
  */
  if (status) {
    this._configReg |= CONFIG_FAST;
  } else {
    if (this._configReg) {
      this._configReg &= ~CONFIG_FAST;
    }
  }
};


/**
 * Module API
 */

exports.ClimateSensor = ClimateSensor;

exports.use = function (hardware, csn) {
  return new ClimateSensor(hardware, csn);
};
