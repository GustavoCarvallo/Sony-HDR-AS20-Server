const http = require('http');
const server = http.createServer((req, res) => {});

//Socket io client for sending base 64 to another server.
var socket = require('socket.io-client')('http://localhost:8000');
var quantity = 0;
var first = true;


socket.on('base64', function(base64){
	console.log('base 64 received');
})

server.listen(3001, () => {
  console.log(`Server running at port: 3001`);
});
