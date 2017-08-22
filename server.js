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
var schedule = require('node-schedule'); 
var nthash = require('smbhash').nthash;

///--- Globals
var SUFFIX = '';
var db = {};
var schemaDb = {};
var lastModTime = 0;
var server = ldap.createServer();

function saveDb()
{
  const content = JSON.stringify(db, null, 2);

  fs.writeFile(config.dataFile, content, 'utf8', function (err) {
      if (err) {
          return console.log(err);
      }
      console.log("Database file saved!");
  });   
}
function loadDbIfNecessary()
{
  var stats = fs.statSync(config.dataFile);
  var mtime = stats.mtime;
    //console.log("Checking if database is outdated. lastModTime: "+lastModTime.toString()+", mtime: "+mtime.toString());
  if(mtime > lastModTime)
  {
    console.log("Database outdated. Rereading from "+config.dataFile);
    lastModTime = mtime;
    db = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
  }
}

///--- START
// read datafile initially
loadDbIfNecessary();
console.log("Reading Schema Data file "+config.schemaDataFile);
schemaDb = JSON.parse(fs.readFileSync(config.schemaDataFile, 'utf8'));

// scheduler
if( !config.mirrorScheduleCronExpression )
    console.log('!!Scheduler Cron Expression missing!!');
else
{
  console.log("Configuring scheduler using cron rule "+config.mirrorScheduleCronExpression);  
  var j = schedule.scheduleJob(config.mirrorScheduleCronExpression, function(){
    console.log("************** Starting scheduled mirroring");
    azure_mirror_do.run();
  });
}
  
// ADMIN BIND
/*
server.bind(config.adminDn, function(req, res, next) {
  adminAtts = db[config.adminDn];
  if (req.dn.toString().toLowerCase().replace(/ /g, '') !== config.adminCn || req.credentials !== adminAtts.userPassword)
    return next(new ldap.InvalidCredentialsError());

  res.end();
  return next();
});
*/

server.bind(SUFFIX, function(req, res, next) {
  // USING AZURE LOGIN HERE
  var theDn = req.dn.toString().toLowerCase().replace(/ /g, '');
  
  // dn bind
  theDn = theDn.replace(config.userRdn+"=",'');
  theDn = theDn.replace(","+config.usersGroupDn,'');
  username = theDn;
  if(config.removeDomainFromCn == true)
    username = username+"@"+config.azureDomain;
  
  var pass = req.credentials;  
  user_auth.checkUserNameAndPass(username, pass, function(err)
  {
    if(err)
    {      
      console.log(username+": Failed login");
      return next(new ldap.InvalidCredentialsError());    
    }
    loadDbIfNecessary();
    theDn = config.userRdn+"="+theDn+","+config.usersGroupDn;
    var userAtts = db[theDn];
    if(userAtts && userAtts.hasOwnProperty("sambaNTPassword"))
    {    
      var userNtHash = nthash(pass);
      if(userAtts["sambaNTPassword"] != userNtHash)
      {
        console.log("Saving NT password hash for user "+theDn);
        userAtts["sambaNTPassword"] = userNtHash;    
        db[theDn] = userAtts;
        saveDb();
      }
    }
    
    console.log(username+" successfully authenticated");
    res.end();
    return next();
  });
});

/*
server.compare(SUFFIX, authorize, function(req, res, next) {
  var theDn = req.dn.toString().toLowerCase().replace(/ /g, '');
  if (!db[theDn])
    return next(new ldap.NoSuchObjectError(theDn));

  if (!db[theDn][req.attribute])
    return next(new ldap.NoSuchAttributeError(req.attribute));

  var matches = false;
  var vals = db[theDn][req.attribute];
  for (var i = 0; i < vals.length; i++) {
    if (vals[i] === req.value) {
      matches = true;
      break;
    }
  }

  res.end(matches);
  return next();
});

server.add(SUFFIX, authorize, function(req, res, next) {
  var theDn = req.dn.toString().toLowerCase().replace(/ /g, '');

  if (db[theDn])
    return next(new ldap.EntryAlreadyExistsError(theDn));

  db[theDn] = req.toObject().attributes;
  saveDb();
  res.end();
  return next();
});

server.del(SUFFIX, authorize, function(req, res, next) {
  var theDn = req.dn.toString().toLowerCase().replace(/ /g, '');
  if (!db[theDn])
    return next(new ldap.NoSuchObjectError(theDn));

  delete db[theDn];
  saveDb();

  res.end();
  return next();
});

server.modify(SUFFIX, authorize, function(req, res, next) {
  var theDn = req.dn.toString().toLowerCase().replace(/ /g, '');
  if (!req.changes.length)
    return next(new ldap.ProtocolError('changes required'));
  if (!db[theDn])
    return next(new ldap.NoSuchObjectError(theDn));

  var entry = db[theDn];

  for (var i = 0; i < req.changes.length; i++) {
    mod = req.changes[i].modification;
    switch (req.changes[i].operation) {
    case 'replace':
      if (!entry[mod.type])
        return next(new ldap.NoSuchAttributeError(mod.type));

      if (!mod.vals || !mod.vals.length) {
        delete entry[mod.type];
      } else {
        entry[mod.type] = mod.vals;
      }

      break;

    case 'add':
      if (!entry[mod.type]) {
        entry[mod.type] = mod.vals;
      } else {
        mod.vals.forEach(function(v) {
          if (entry[mod.type].indexOf(v) === -1)
            entry[mod.type].push(v);
        });
      }

      break;

    case 'delete':
      if (!entry[mod.type])
        return next(new ldap.NoSuchAttributeError(mod.type));

      delete entry[mod.type];

      break;
    }
  }

  saveDb();
  res.end();
  return next();
});
 */
 
//server.search(SUFFIX, authorize, function(req, res, next) {
server.search(SUFFIX, function(req, res, next) 
{
  loadDbIfNecessary();
  var theDn = req.dn.toString().toLowerCase().replace(/ /g, '');
  var attStr = "";
  if(req.hasOwnProperty("attributes"))
    attStr = req.attributes.toString();
  console.log('Search started. Base object: ' + theDn + '. Scope: ' + req.scope + '. Filter: ' + req.filter.toString() + ' Attributes: ' + attStr); 

  //
  if(schemaDb.hasOwnProperty(theDn))
  {
    res.send({
      dn: theDn,
      attributes: schemaDb[theDn]
    });
    res.end();
    return next();    
  }
  else if(theDn=="")
  {
    theDn = config.baseDn;
  }

  if (!db[theDn])    
    return next(new ldap.NoSuchObjectError(theDn));

  var scopeCheck;

  switch (req.scope) {
  case 'base':
    if (req.filter.matches(db[theDn])) {
      console.log("sending "+theDn);
      res.send({
        dn: theDn,
        attributes: db[theDn]
      });
    }

    res.end();
    return next();

  case 'one':
    scopeCheck = function(k) {
      if (req.dn.equals(k))
        return false;

      var parent = ldap.parseDN(k).parent();
      return (parent ? parent.equals(req.dn) : false);
    };
    break;

  case 'sub':
    scopeCheck = function(k) {
      return (req.dn.equals(k) || req.dn.parentOf(k));
    };

    break;
  }

  Object.keys(db).forEach(function(key) {
    if (!scopeCheck(key))
      return;

    if (req.filter.matches(db[key])) {
      console.log("sending "+key);
      res.send({
        dn: key,
        attributes: db[key]
      });
    }
  });

  res.end();
  return next();
});



///--- Fire it up

server.listen(389, function() {
  console.log('LDAP server up at: %s', server.url);
});