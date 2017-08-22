# o365-ldap-proxy
o365-ldap-proxy is a tool for authenticating against Office 365 through a LDAP wrapper server. This is especially useful when migrating to Office 365 / Azure AD and one dont want to maintain the on-premise AD controller just for mirroring purposes.

## How it works
o365-ldap-proxy starts a custom LDAP server. When doing the bind, the program actually uses Microsoft Graph API to check the user credentials. 
As a second tool the script azure_mirror.js uses the Graph API to retrieve all users of an Office 365 Azure Active Directory. The Office 365 users may then by used to "update" the local LDAP proxy.

## Installation
 * Install NodeJS
 * npm install
 
## Configuration
 * Create an Application in Azure as described here: https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-integrating-applications 
 * Copy "data.sample.json" to "data.json" and provide the initial ldap data
 * Copy "schemaData.sample.json" to "schemaData.json" and provide the initial ldap schema. the default is a Synolody Directory Service
 * Copy "config.sample.js" to "config.js" and make configuration changes. Pay special caution to the function updateDatabase(). The updating of your database by mirror office 365 has to be done by yourself
 * Start the server using "npm start" or "node server.js" (the mirroring is automatically scheduled by the server)
 * Create a service for the server on your system

### Complete setup on Ubuntu 
 * Run sudo-apt get install nodejs
 * Run sudo-apt get install npm
 * Make sure you have the latest NodeJS (>6.0) on Ubuntu, hints can be found here https://askubuntu.com/questions/426750/how-can-i-update-my-nodejs-to-the-latest-version
 * Follow the steps descibed above in "Configuration"
 * Create a service script as described here https://askubuntu.com/questions/351879/how-to-create-a-service-on-ubuntu-upstart

## Known issues/Limitations
 * No SSL Support
 * Not much error checking, be cautious when doing the config
 * Not much documentation, please ask ;)
 
## Acknowledgements
 * Code reused from https://github.com/microsoftgraph/nodejs-apponlytoken-rest-sample
