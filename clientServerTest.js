const http = require('http');
const server = http.createServer((req, res) => {});
var io = require('socket.io')(server);
var quantity = 0;
var first = true;


io.on('connection', function(socket) {
	console.log('Un cliente se ha conectado');
  socket.on('base64', function(base64){
    console.log(`A new base 64 image has arrived, frame number: ${++quantity}`);
    if(first){
      console.log(base64);
      first = false;
    }
  });
});

server.listen(3001, () => {
  console.log(`Server running at port: 3001`);
});
