var temphum = require('../');

temphum.initialize('A');

while(true) {
  var temp = temphum.get_temp();
  console.log(temphum);
  console.log("temp ", temp);
}