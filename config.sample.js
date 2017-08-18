/*
 * Copyright (c) Microsoft All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

// Application credentials from the Azure Management Portal.
module.exports = {
  clientId: 'ENTER_YOUR_CLIENT_ID',
  clientSecret: 'ENTER_YOUR_SECRET',
  tokenEndpoint: 'ENTER_YOUR_TOKEN_ISSUING_ENDPOINT'
  // port of the ldap server
  port: 1389,
  // From the Azure Portal, if you click on the Help icon in the upper right and then choose 'Show Diagnostics' you can find the tenant id in the diagnostic JSON.
  tenantId: "a333cd5f-e917-488a-9ab4-007a2217387b",
  // the simulated base dn (e.g. DC=contoso,DC=com)
  baseDn: "DC=contoso,DC=com",
  // the domain associated with it
  azureDomain: "contoso.com",
  // there will be one group named "all" containing all users, change the name here if wanted
  allGroupName: "all",
  // where the sync file will be saved
  dataFile: "./data.json",
  // a cron expression for scheduling the mirroring
  mirrorScheduleCronExpression: "0,30 * * * *",
  // specify array with users to exclude (substrings may be used)
  excludeUsers: null,
  // add users (see data.sample.json)
  includeUser: [],
  // set to true to remove the domain from the logins and the synced data, e.g. "user@contoso.com" will just be "user"
  removeDomainFromCn: false,
  // if authname and authpass are set, these credentials may also be used for doing a simple bind
  authName: null,
  authPass: null
};
