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
  console.log("Updating database");
  var usersGroupGroupDn = "cn=users,cn=groups,dc=contoso,dc=com";
  var usersGroup = db[usersGroupGroupDn];
    //console.dir(usersGroup);
  var sambaDomain = db["sambadomainname=contoso,dc=contoso,dc=com"];
  var member = [];
  var memberUid = [];
  
  for (var i = 0, len = graphUsers.length; i < len; i++) 
  {
    var graphObj = graphUsers[i];
    var uid = graphObj["userPrincipalName"];
    var hash = Math.abs(encode().value( graphObj.id )).toString(); 
    var userDn = config.userRdn+"="+uid+","+config.usersDnSuffix;
    var sambaNtPass = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
    var userAtts = db[userDn];
    if(userAtts && userAtts.hasOwnProperty("sambaNTPassword"))
    {    
      sambaNtPass = userAtts["sambaNTPassword"];
    }
    
    var attributes = {
      "objectClass": [
        "extensibleObject",
        "sambaIdmapEntry",
        "sambaSamAccount",
        "apple-user",
        "inetOrgPerson",
        "organizationalPerson",
        "person",
        "shadowAccount",
        "posixAccount",
        "top"
      ],
      "cn": uid,
      "gidNumber": usersGroup["gidNumber"],
      "homeDirectory": "/home/"+uid,
      "sambaSID": sambaDomain.sambaSID+"-"+hash,
      "sn": graphObj.surname,
      "uid": uid,
      "uidNumber": hash,
      "apple-generateduid": graphObj.id,
      "authAuthority": ";basic;",
      "displayName": graphObj.displayName,
      "loginShell": "/bin/sh",
      "mail": graphObj.mail,
      "memberOf": usersGroupGroupDn,
      "sambaAcctFlags": "[U          ]",
      "sambaLMPassword": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "sambaNTPassword": sambaNtPass,
      "sambaPasswordHistory": "0000000000000000000000000000000000000000000000000000000000000000",
      "sambaPwdLastSet": "1503321620",
      "shadowExpire": "-1",
      "shadowFlag": "0",
      "shadowInactive": "0",
      "shadowLastChange": "17399",
      "shadowMax": "99999",
      "shadowMin": "100000",
      "shadowWarning": "7",
      "createTimestamp": "20170820070521Z",
      "creatorsName": "uid=admin,cn=users,dc=contoso,dc=com",
      "entryCSN": "20170821132021.008850Z#000000#000#000000",
      "entryDN": userDn,
      "entryUUID": graphObj.id,
      "hasSubordinates": "FALSE",
      "modifiersName": "uid=admin,cn=users,dc=contoso,dc=com",
      "modifyTimestamp": "20170821132021Z",
      "pwdChangedTime": "20170821132021Z",
      "structuralObjectClass": "inetOrgPerson",
      "subschemaSubentry": "cn=Subschema",
      "gecos": "Default User",
    }
    
    console.log("Inserting user "+uid);
    db[userDn] = attributes;
    member.push(userDn);
    memberUid.push(uid);
  }
    
  console.log("Updating user group "+usersGroupGroupDn);
  var prevMembers = usersGroup["member"];
  for (var i = 0, len = prevMembers.length; i < len; i++) 
  {
    var prevMember = prevMembers[i];
    if(member.indexOf(prevMember) == -1)
    {
      console.log("!!!!! Deleting member "+prevMember);
      delete db[prevMember];
    }
  }
  usersGroup["member"] = member;
  usersGroup["memberUid"] = memberUid;
  db[usersGroupGroupDn] = usersGroup;
  
  return db;
} 

module.exports = config;

