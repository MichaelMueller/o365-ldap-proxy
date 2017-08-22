var util = require('./util');
var log = console.log;
console.log = function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);
    log.apply(console, [util.formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};
//=======================================

var ldif = require('ldif');

var inputLdif = process.argv[2];
var outputJsonFile = process.argv[3];
console.log("Trying to convert "+inputLdif+" to "+outputJsonFile);
file = ldif.parseFile(inputLdif);
//console.dir(file);
output_options = {};
 
var record = file;
var obj = record.toObject(output_options);

var db = {};
for (var i = 0; i < obj.entries.length; i++) 
{
  db[obj.entries[i].dn.toLowerCase()] = obj.entries[i].attributes;
}
//console.dir(obj);

const fs = require('fs');
const content = JSON.stringify(db, null, 2);

fs.writeFile(outputJsonFile, content, 'utf8', function (err) {
    if (err) {
        return console.log(err);
    }
    console.log("JSON file was saved!");
}); 