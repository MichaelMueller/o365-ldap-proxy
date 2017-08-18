var auth = require('./auth');
var graph = require('./graph');
var config = require('./config');

var azure_mirror_do = {};
azure_mirror_do.run = function (user, pass, cb)
{    
  // Get an access token for the app.
  auth.getAccessToken().then(function (token) {
    // Get all of the users in the tenant.
    graph.getUsers(token)
      .then(function (users) {
        var data = [];      
        
        var domainDc = config.baseDn.substring(0, config.baseDn.indexOf(","));
        var domainObj = {
            dn: config.baseDn,
            attributes: {
              objectclass: ['domain'],
              dc: [domainDc]
            }
        };
        data.push(domainObj);
        
        var uniqueMembers = [];      
        
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
          
          var myCn = (graphObj.userPrincipalName);
          if(config.removeDomainFromCn)
            myCn = myCn.replace("@"+config.azureDomain, '');
          var myDn = "cn=" + myCn + "," + config.baseDn;
          uniqueMembers.push(myDn);
          
          var ldapObj = {
            dn: myDn,
            attributes: {
              objectclass: ['inetorgperson'],
              cn: [myCn],
              entryUUID: [graphObj.id],
              givenName: [graphObj.givenName],
              sn: [graphObj.surname],
              displayName: [graphObj.displayName],
              mail: [graphObj.mail],
              userPassword: ['empty']
            }
          };
          data.push(ldapObj);
        }
        
        // add group for all
        var groupObj = {
            dn: "cn=" + config.allGroupName + "," + config.baseDn,
            attributes: {
              objectclass: ['groupOfUniqueNames'],
              cn: [config.allGroupName],
              description: ["Group "+config.allGroupName],
              uniqueMember: uniqueMembers
            }
        };
        data.push(groupObj);
        
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