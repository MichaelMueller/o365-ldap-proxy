var auth = require('./auth');
var graph = require('./graph');
var config = require('./config');
var fs = require('fs'); 

var azure_mirror_do = {};

azure_mirror_do.run = function ()
{    
  // Get an access token for the app.
  auth.getAccessToken().then(function (token) 
  {
    // Get all of the users in the tenant.
    graph.getUsers(token).then(function (users) 
    {
      //console.dir(users);
      
      var graphUsers = [];  
      for (var i = 0, len = users.length; i < len; i++) 
      {
        var graphObj = users[i];
        if(config.removeDomainFromCn)
          graphObj["userPrincipalName"] = graphObj["userPrincipalName"].replace("@"+config.azureDomain, "");
        
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
        graphUsers.push(graphObj);                 
      }
      console.log("trying to read from "+config.dataFile);

      var db = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
      db = config.updateDatabase(graphUsers, db);
      const content = JSON.stringify(db, null, 2);

      fs.writeFile(config.dataFile, content, 'utf8', function (err) {
          if (err) {
              console.log(err);
          }
          console.log("New Database file saved!");
      });   
        
    }, function (error) 
    {
        console.log('>>> Error getting users: ' + error);
    });
  }, function (error) 
  {
    console.log('>>> Error getting access token: ' + error);
  });
}; 
 
 module.exports = azure_mirror_do;
