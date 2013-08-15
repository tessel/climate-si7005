var tm = process.binding('tm');
var Tessel = require('tm');

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

    WAKE_UP_TIME  = 15
    ;

// used http://www.silabs.com/Support%20Documents/TechnicalDocs/Si7005.pdf as a reference
var ADDRESS = 0x40,
    DATAh = 0x01, // Relative Humidity or Temperature, High Byte
    DATAl = 0x02, // Relative Humidity or Temperature, Low Byte
    cs = null,
    port = null,
    LOW = 0,
    HIGH = 1
    ;

function read_registers (addressToRead, bytesToRead)
{
  return tm.i2c_master_request_blocking(tm.I2C_1, ADDRESS, [addressToRead], bytesToRead);
}

function read_register (addressToRead)
{
  return read_registers(addressToRead, 1)[0];
}

// Write a single byte to the register.
function write_register (addressToWrite, dataToWrite)
{
  tm.i2c_master_send_blocking(tm.I2C_1, ADDRESS, [addressToWrite, dataToWrite]);
}

// pulls the cs line high or low
function csn(mode){
  console.log("cs ", cs);
  cs.set(mode);
}

// reads the data registers
function get_data(configValue){
  // pull the cs line low
  csn(LOW);
  // zzz until the chip wakes up
  tm.sleep_ms(WAKE_UP_TIME); 
  write_register(REG_CONFIG, CONFIG_START | configValue | _config_reg);

  var status = STATUS_NOT_READY;
  while ( status & STATUS_NOT_READY )
  {
    // write_register( REG_STATUS, 0 );
    status = read_register(REG_STATUS );
  }

  write_register(REG_DATA, 0);

  var datah = read_register(DATAh);
  var datal = read_register(DATAl);

  csn(HIGH);

  return datal + datah << 8;
}

// returns % humidity
function get_humidity(){
  var rawHumidity = get_data( CONFIG_HUMIDITY ) >> 4;
  var curve = ( rawHumidity / HUMIDITY_SLOPE ) - HUMIDITY_OFFSET;
  var linearHumidity = curve - ( (curve * curve) * a2 + curve * a1 + a0);
  var linearHumidity = linearHumidity + ( _last_temperature - 30 ) * ( linearHumidity * q1 + q0 );

  return linearHumidity; 
}

// returns temp in degrees celcius
function get_temp(x) {
  var rawTemperature = get_data( CONFIG_TEMPERATURE ) >> 2;
  var _last_temperature = ( rawTemperature / TEMPERATURE_SLOPE ) - TEMPERATURE_OFFSET;


  return _last_temperature;
}

function set_heater(status){
  if (status == ENABLE) {
    _config_reg |= CONFIG_HEAT;
  } else if (status == DISABLE) {
    _config_reg ^= CONFIG_HEAT;
  }
}

function set_fast_measure(status){
  if (status == ENABLE) {
    _config_reg |= CONFIG_FAST;
  } else if (status == DISABLE) {
    _config_reg ^= CONFIG_FAST;
  }
}

function initialize (p, next)
{
  tm.i2c_initialize(tm.I2C_1);
  tm.i2c_master_enable(tm.I2C_1);
  console.log("Starting up S17005...");
  port = Tessel.port(p);

  cs = port.gpio(1);
  cs.setMode(OUTPUT);
  csn(LOW);
  tm.sleep_ms( WAKE_UP_TIME );
  var id = read_register(REG_ID);
  if (id != ADDRESS) {
    throw "Cannot connect to S17005. Got id: " + id;
  }
  console.log("Connected to S17005");
}

exports.initialize = initialize;
exports.set_heater = set_heater;
exports.set_fast_measure = set_fast_measure;
exports.get_temp = get_temp;
exports.get_humidity = get_humidity;
