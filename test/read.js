// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/* test rig */
function tap (max) { tap.t = 1; console.log(tap.t + '..' + max); };
function ok (a, d) { console.log(a ? 'ok ' + (tap.t++) + ' -' : 'not ok ' + (tap.t++) + ' -', d); }

/* script */

tap(4);

var tessel = require('tessel');

var port = process.argv[2] || 'A';
var climate = require('../').use(tessel.port[port]);
ok(true, 'starting up si7005 on port ' + port);

climate.on('ready', function () {
  ok(true, 'connected to si7005');

  // Loop forever
  climate.readTemperature('f', function (err, temp) {
    ok(typeof temp == 'number', 'read temp: ' + String(temp) + ' deg F');

    climate.readHumidity(function (err, humid) {
      ok(typeof humid == 'number', 'read humidity: ' + String(humid) + ' deg %RH');
    });
  });
});

climate.on('error', function(err) {
  console.error('# error -', err);
  process.exit(1);
});
