var config = require('./config');
var msRestAzure = require('ms-rest-azure');

// Enter your tenant ID here which can be found from your Azure AD URL 
// Eg. https://manage.windowsazure.com/example.com#Workspaces/ActiveDirectoryExtension/Directory/<TenantId>/users 
var user_auth = {};
user_auth.checkUserNameAndPass = function (user, pass, cb)
{
  msRestAzure.loginWithUsernamePassword(user, pass, { tokenAudience: 'graph', domain: config.tenantId }, cb);
}; 
 
 module.exports = user_auth;
