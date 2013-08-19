var temphum = require('../');

temphum.initialize('A');

setInterval(function () {
  var temp = temphum.get_temp();
  console.log("temp ", temp);
}, 100);