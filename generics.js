var connect = require('connect');
var server = connect.createServer();
server.use(connect.staticProvider(__dirname + '/public'));

var clients = [];
var dnode = require('dnode');
dnode(function (client, conn) {
	  conn.on('ready', function () {
		      console.log(client);
		      clients.push(client);
		      clients.forEach(function (c) {c.hi();});
		 });
	  this.cat = function (cb) {
              cb('meow');
	  };
	  this.get = function (x, cb) {
	      console.log('x: ' + x);
	      cb(x + 1 + '');
	  };
}).listen(server);

server.listen(6857);
console.log('http://localhost:6857/');