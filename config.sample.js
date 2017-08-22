var encode = require( 'hashcode' ).hashCode;

var config = {
  // client information for using the azure api
  clientId: 'ENTER_YOUR_CLIENT_ID',
  clientSecret: 'ENTER_YOUR_SECRET',
  tokenEndpoint: 'ENTER_YOUR_TOKEN_ISSUING_ENDPOINT'
  // port of the ldap server
  port: 389,
  // From the Azure Portal, if you click on the Help icon in the upper right and then choose 'Show Diagnostics' you can find the tenant id in the diagnostic JSON.
  tenantId: "a333cd5f-e917-488a-9ab4-007a2217387b",
  // the simulated base dn
  baseDn: "dc=contoso,dc=com",
  // the domain associated with it
  azureDomain: "contoso.com",
  // there will be one group named "all" containing all users, change the name here if wanted
  allGroupName: "all",
  // where the sync file will be saved
  dataFile: "./data.json",
  // a cron expression for scheduling the mirroring
  mirrorScheduleCronExpression: "0,30 * * * *",
  // specify array with users to exclude (substrings may be used)
  excludeUsers: [],
  // set to true to remove the domain from the logins and the synced data, e.g. "user@contoso.com" will just be "user"
  removeDomainFromCn: true,
  // the rdn for the user
  userRdn: "uid",
  // the rdn for the user
  usersDnSuffix: "cn=users,dc=contoso,dc=com"
};

// update the db in this plugin function
config.updateDatabase = function(graphUsers, db)
{
  return db;
} 

module.exports = config;

