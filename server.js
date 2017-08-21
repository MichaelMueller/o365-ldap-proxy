var util = require('./util');
var log = console.log;
console.log = function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);
    log.apply(console, [util.formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};
//=======================================

var ldap = require('ldapjs');
var config = require('./config');
var user_auth = require('./user_auth');
var fs = require('fs');
var azure_mirror_do = require('./azure_mirror_do');

if (!fs.existsSync(config.dataFile)) 
{
  console.log("Initial mirroring necessary. Running now");   
  azure_mirror_do.run();
}
if( config.mirrorScheduleCronExpression )
{  
  console.log("Configuring scheduler using cron rule "+config.mirrorScheduleCronExpression);   
  var schedule = require('node-schedule'); 
  var j = schedule.scheduleJob(config.mirrorScheduleCronExpression, function(){
    console.log("************** Starting scheduled mirroring");
    azure_mirror_do.run();
  });
}
else
{  
  console.log("Scheduler is disabled");   
}

var server = ldap.createServer();


server.bind(config.baseDn, function(req, res, next) 
{
  var username = req.dn.toString().replace(/ /g, '');
  // anonymous bind
  if(username == "" && config.enableAnonymousLogin == true)
    return next();
  
  // dn bind
  if( (username).indexOf(config.baseDn.toLowerCase()) !== -1)
  {  
    username = username.replace(',' + config.baseDn.toLowerCase(), '');  
    username = username.substr(username.indexOf("=")+1);
  }
  if(config.removeDomainFromCn == true)
    username = username+"@"+config.azureDomain;  
  
  var pass = req.credentials;
  
  user_auth.checkUserNameAndPass(username, pass, function(err)
  {
    if(err)
    {      
      console.log(username+" failed login");            

      return next(new ldap.InvalidCredentialsError());    
    }
    
    console.log(username+" successfully authenticated");
    res.end();
    return next();
  });

});

server.search("", function(req, res, next) {
  var baseObj = req.dn.toString().replace(/ /g, ''); 
  console.log('RootDSE started. Base object: ' + baseObj + '. Scope: ' + req.scope + '. Filter: ' + req.filter.toString());
  
  var tmp_data = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));  
  for (var i = 0; i < tmp_data.length; i++) 
  {
    if( req.scope == "one" && tmp_data[i].dn == config.baseDn ) 
      continue;
    if (req.filter.matches(tmp_data[i].attributes)) 
    {
      res.send(tmp_data[i]);
    }
  }
  res.end();
});

server.search(config.baseDn, function(req, res, next) {
  var baseObj = req.dn.toString().replace(/ /g, ''); 
  console.log('Search started. Base object: ' + baseObj + '. Scope: ' + req.scope + '. Filter: ' + req.filter.toString());
  
  var tmp_data = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
  if(baseObj == config.baseDn)
  {
    for (var i = 0; i < tmp_data.length; i++) 
    {
      if( req.scope == "one" && tmp_data[i].dn == config.baseDn ) 
        continue;
      if (req.filter.matches(tmp_data[i].attributes)) 
      {
        res.send(tmp_data[i]);
      }
    }    
  }
  else
  {
    for (var i = 0; i < tmp_data.length; i++) 
    {      
      if( req.scope == "base" && tmp_data[i].dn == baseObj ) 
      {
        res.send(tmp_data[i]);
        break;
      }      
    }    
  }
    
  res.end();
});

server.listen(config.port, function() {
  console.log('/etc/passwd LDAP server up at: %s', server.url);
});