var util = require('./util');
var log = console.log;
console.log = function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);
    log.apply(console, [util.formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};
//=======================================

var azure_mirror_do = require('./azure_mirror_do');

console.log("==================")
console.log("Starting mirroring");
azure_mirror_do.run();