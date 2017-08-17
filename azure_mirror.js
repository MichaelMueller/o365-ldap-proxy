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

var auth = require('./auth');
var graph = require('./graph');
var config = require('./config');

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
        
        if( config.skipUsersNotInAzureDomain && graphObj.userPrincipalName.indexOf(config.azureDomain) == -1 )
          continue;
        
        var myCn = (graphObj.userPrincipalName).replace("@"+config.azureDomain, '');
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
            description: ["Grouap "+config.allGroupName],
            uniqueMember: uniqueMembers
          }
      };
      data.push(groupObj);
      
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