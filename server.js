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

var ldap = require('ldapjs');
var config = require('./config');
var user_auth = require('./user_auth');
var tmp_data = require('./tmp_data');

var server = ldap.createServer();


server.bind(config.baseDn, function(req, res, next) 
{
  var username = req.dn.toString().replace(/ /g, '');    
  username = username.toLowerCase();
  username = username.replace(',' + config.baseDn.toLowerCase(), '');  
  username = (username.replace('cn=', ''))+"@"+config.azureDomain;  
  var pass = req.credentials;
  
  user_auth.checkUserNameAndPass(username, pass, function(err)
  {
    if(err)
      return next(new ldap.InvalidCredentialsError());
    
    console.log(username+" successfully authenticated");
    res.end();
    return next();
  });

});

server.search(config.baseDn, function(req, res, next) {
  console.log('Search started. Base object: ' + req.dn.toString() + '. Scope: ' + req.scope + '. Filter: ' + req.filter.toString());

  for (var i = 0; i < tmp_data.length; i++) 
  {
    if (req.filter.matches(tmp_data[i].attributes)) 
    {
      res.send(tmp_data[i]);
    }
  }
    
  res.end();
});

server.listen(config.port, function() {
  console.log('/etc/passwd LDAP server up at: %s', server.url);
});