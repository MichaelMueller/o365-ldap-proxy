var ldap = require('ldapjs');

var server = ldap.createServer();

server.bind('cn=root', function(req, res, next) {
  if (req.dn.toString() !== 'cn=root' || req.credentials !== 'secret')
    return next(new ldap.InvalidCredentialsError());

  res.end();
  console.log("logged in");
  return next();
});

server.search('o=example', function(req, res, next) {
  console.log('base object: ' + req.dn.toString());
  console.log('scope: ' + req.scope);
  console.log('filter: ' + req.filter.toString());
  var obj = {
    dn: 'o=example',
    attributes: {
      objectclass: ['top', 'organization'],
      o: ['example']
    }
  };
	res.send(obj);
  res.end();
});
server.listen(1389, function() {
  console.log('/etc/passwd LDAP server up at: %s', server.url);
});