var log = console.log;
console.log = function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);

    function formatConsoleDate (date) {
        var day = date.getDate();
        var month = date.getMonth()+1;
        var year = date.getFullYear();
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        return '[' + year + "/" + month + "/" + day + " " +
               ((hour < 10) ? '0' + hour: hour) +
               ':' +
               ((minutes < 10) ? '0' + minutes: minutes) +
               ':' +
               ((seconds < 10) ? '0' + seconds: seconds) +
               '.' +
               ('00' + milliseconds).slice(-3) +
               '] ';
    }

    log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};
//=======================================

var config = require('./config');
var GraphAPI = require('azure-graphapi');
 
var graph = new GraphAPI(config.azureDomain, config.clientId, config.clientSecret);
graph.get('users', function(err, users) {
    if (!err) {
      console.dir(users)
    }
    else
    {
      console.log("failed: "+err.toString());    
    }
});