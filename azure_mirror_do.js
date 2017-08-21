var auth = require('./auth');
var graph = require('./graph');
var config = require('./config');
var encode = require( 'hashcode' ).hashCode;

var azure_mirror_do = {};
azure_mirror_do.getDomainObject = function() {

  var domainDc = config.baseDn.substring(0, config.baseDn.indexOf(","));
  var domainObj = {
    
      dn: config.baseDn,
      attributes: {
        objectClass: ['dcObject', 'organization', "top", "OpenLDAProotDSE"],
        dc: domainDc,
        name: domainDc,
        entrydn: config.baseDn,
        o: config.orgName,        
        entryuuid: "46364f2a-186f-1037-8a89-23e38af4fd13",
        "subschemaSubentry": ["cn=subschema"],
        structuralObjectClass: "organization",
        "distinguishedName": config.baseDn,
        rootDomainNamingContext: config.baseDn,
        namingContexts: [config.baseDn]
      }
  };  
  return domainObj;
}

azure_mirror_do.getAllGroupObject = function(allGroupId, memberUids, uniqueMembers) {
  
  // add group for all
  var groupObj = {
      dn: "cn=" + config.allGroupName + "," + config.baseDn,
      attributes: {
        objectclass: ['groupOfUniqueNames', 'posixgroup', 'top', 'sambaGroupMapping'],
        cn: config.allGroupName,
        gidNumber: allGroupId,
        description: "Group "+config.allGroupName,              
        entryuuid: "4637e56a-186f-1037-8a8a-23e38af4fd13",
	"sambaSID": "S-1-5-21-"+allGroupId,
        memberuid: memberUids,
        uniqueMember: uniqueMembers,                         
        structuralObjectClass: "posixGroup",
        subschemaSubentry: "cn=Subschema"
      }
  };
  return groupObj;
}

azure_mirror_do.getUserObject = function(graphObj, allGroupId) {
  var uid = (graphObj.userPrincipalName);
  if(config.removeDomainFromCn)
    uid = uid.replace("@"+config.azureDomain, '');
  var myCn = graphObj.displayName;
  var myDn = "uid=" + uid + "," + config.baseDn;
  var hash = Math.abs(encode().value( graphObj.id )); 
  
  var ldapObj = {
    dn: myDn,
    attributes: {
      objectclass: ['inetorgperson', 'posixaccount', 'top', 'shadowAccount', 'person', 'sambaSamAccount'],
      cn: graphObj.displayName,
      entryuuid: graphObj.id,
      gidNumber: allGroupId,      
      givenName: graphObj.givenName,
      sn: graphObj.surname,
      displayName: graphObj.displayName,
      mail: graphObj.mail,
      "uid": uid,
      "sambaSID": "S-1-5-21-"+hash,
      uidNumber: hash,
      userPassword: hash,
      homeDirectory: "/home/"+uid,
      structuralObjectClass: "inetOrgPerson",
      shadowExpire: -1,
      shadowFlag: 0,
      shadowLastChange: 0,
      shadowMax: 99999,
      shadowMin: 0,
      shadowWarning: 7
    }
  };
  
  return ldapObj;
}

azure_mirror_do.run = function (user, pass, cb)
{    
  // Get an access token for the app.
  auth.getAccessToken().then(function (token) {
    // Get all of the users in the tenant.
    graph.getUsers(token)
      .then(function (users) {
        var data = [];      
        
        var domainObj = azure_mirror_do.getDomainObject();
        data.push(domainObj);
          var groupid = Math.abs(encode().value( config.allGroupName )); 
        
        var uniqueMembers = [];    
        var memberUids = [];    
        
        for (var i = 0, len = users.length; i < len; i++) 
        {
          var graphObj = users[i];
          
          //if( config.skipUsersNotInAzureDomain && graphObj.userPrincipalName.indexOf(config.azureDomain) == -1 )
            //continue;
          if(config.excludeUsers)
          {
            var skip = false;
            for (var k = 0, len2 = config.excludeUsers.length; k < len2; k++) 
            {
              if( graphObj.userPrincipalName.search(config.excludeUsers[k]) > -1 )
              {
                skip = true;
                break;
              }
            }
            
            if(skip)
            {            
              console.log("Skipping "+ graphObj.userPrincipalName+" due to exclude rules" )
              continue;          
            }
            
          }
          
         
          var ldapObj = azure_mirror_do.getUserObject(graphObj, groupid);
          data.push(ldapObj);
          
          uniqueMembers.push(ldapObj.dn);          
          memberUids.push(ldapObj.attributes.uid);
        }
        
        
        data.push(azure_mirror_do.getAllGroupObject(groupid, memberUids, uniqueMembers));
        
        for (var i = 0, len = config.includeUser.length; i < len; i++) 
        {        
          data.push(config.includeUser[i]);
        }      
        
        const fs = require('fs');
        const content = JSON.stringify(data, null, 2);

        fs.writeFile(config.dataFile, content, 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("Mirror file was saved!");
        }); 
        
      }, function (error) {
        console.error('>>> Error getting users: ' + error);
      });
  }, function (error) {
    console.error('>>> Error getting access token: ' + error);
  });

}; 
 
 module.exports = azure_mirror_do;
