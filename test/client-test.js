var ldap = require('ldapjs');

var client = ldap.createClient({url: 'ldap://127.0.0.1:1389'}, function (err){
  if (err) {
    console.log('Failed');
    process.exit(1);
  }
  else
    console.log('Through');
});

  client.bind("cn=root", "secret", function (err) {
    if(err){
    console.log('Failed');
    process.exit(1);
    }else{
    console.log('Bind');
	
	client.search('o=example', {}, function(err, res) {
  if(err){
    console.log('Failed Search');
    process.exit(1);
    }else{
    console.log('Search done');	
  res.on('searchEntry', function(entry) {
    console.log('entry: ' + JSON.stringify(entry.object));
  });
  res.on('searchReference', function(referral) {
    console.log('referral: ' + referral.uris.join());
  });
  res.on('error', function(err) {
    console.error('error: ' + err.message);
  });
  res.on('end', function(result) {
    console.log('status: ' + result.status);
  });	
	}});
	
  client.unbind(function(err) {
   if (err) {
    console.log('Failed');
    process.exit(1);
  }
  else
    console.log('Unbind');
    process.exit(0);
});
  }});
  