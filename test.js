var SI7005_ADR = 0x40
var REG_ID  = 0x11

var firmata = require('firmata');
var board = new firmata.Board('/dev/tty.usbmodem1421',function(){
  console.log('connected');
  board.pinMode(2, board.MODES.OUTPUT);
  board.digitalWrite(2, board.HIGH);
  board.sendI2CConfig();
  board.digitalWrite(2, board.LOW);

  board.sendI2CWriteRequest(SI7005_ADR | 0x80, [REG_ID]);
  console.log('writing');
  board.sendI2CReadRequest(SI7005_ADR, 1, function (data) {
    console.log(null, data);
  });
});  

board.on('string', function (str) {
  console.error('STRING', str);
})