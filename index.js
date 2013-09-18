var events = require('events');
var util = require('util');


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
  this.hardware = hardware;
  this.csn = csn;
  this._config_reg = 0;

  // I2C object for address
  this.i2c = new this.hardware.I2C(I2C_ADDRESS);
  this.i2c.initialize();
  
  this.hardware.pinOutput(this.csn);
  this.hardware.digitalWrite(this.csn, 0);

  var self = this;
  setTimeout(function () {
    self._readRegister(REG_ID, function ok (err, reg) {
      var id = reg & ID_SAMPLE;
      if (id != ID_SI7005) {
        throw "Cannot connect to S17005. Got id: " + id.toString(16);
      }

      self.emit('connected');
    });
  }, WAKE_UP_TIME);
}

util.inherits(ClimateSensor, events.EventEmitter)

// Read I2C device register.
ClimateSensor.prototype._readRegister = function (addressToRead, next)
{
  this.i2c.transfer([addressToRead], 1, function (err, ret) {
    next(err, ret && ret[0]);
  });
}


// Write to I2C device regsiter.
ClimateSensor.prototype._writeRegister = function (addressToWrite, dataToWrite, next)
{
  this.i2c.send([addressToWrite, dataToWrite], next);
}


// Reads data from a sensor. Prompt for configuration, then poll until ready.
ClimateSensor.prototype.getData = function (configValue, next)
{
  // pull the cs line low
  this.hardware.digitalWrite(this.csn, 0);

  // zzz until the chip wakes up
  var self = this;
  setTimeout(function () {
    self._writeRegister(REG_CONFIG, CONFIG_START | configValue | self._config_reg, function () {
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
                next(null, datal | datah << 8)
              });
            });
          })
        })
      })
    });
  }, WAKE_UP_TIME);
}


// Returns % humidity.
ClimateSensor.prototype.readHumidity = function (next)
{
  var self = this;
  this.getData(CONFIG_HUMIDITY, function (err, reg) {
    var rawHumidity = reg >> 4;
    var curve = ( rawHumidity / HUMIDITY_SLOPE ) - HUMIDITY_OFFSET;
    var linearHumidity = curve - ( (curve * curve) * a2 + curve * a1 + a0);
    var linearHumidity = linearHumidity + ( self._last_temperature - 30 ) * ( linearHumidity * q1 + q0 );

    next(null, linearHumidity);
  })
}


// Returns temp in degrees celcius or fahrenheit (type == 'f')
ClimateSensor.prototype.readTemperature = function (/*optional*/ type, next)
{
  next = next || type;

  var self = this;
  this.getData(CONFIG_TEMPERATURE, function (err, reg) {
    // console.log('Temp regs:', reg);
    var rawTemperature = reg >> 2;
    var temp = ( rawTemperature / TEMPERATURE_SLOPE ) - TEMPERATURE_OFFSET;
    self._last_temperature = temp;

    if (type == 'f') {
      temp = temp * (9/5) + 32;
    }

    next(null, temp);
  });
}


// Set the "heater" config to reduce heating memory.
ClimateSensor.prototype.setHeater = function (status)
{
  if (status) {
    this._config_reg |= CONFIG_HEAT;
  } else {
    this._config_reg ^= CONFIG_HEAT;
  }
}


// Draw lower power on successive polling.
ClimateSensor.prototype.setFastMeasure = function  (status)
{
  if (status) {
    this._config_reg |= CONFIG_FAST;
  } else {
    this._config_reg ^= CONFIG_FAST;
  }
}


/**
 * Module API
 */

// .connect() function or direct constructor
exports.ClimateSensor = ClimateSensor;
exports.connect = function (hardware, csn) {
  return new ClimateSensor(hardware, csn);
}