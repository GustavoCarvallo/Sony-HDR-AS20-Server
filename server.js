const http = require('http');

//Creates the server.
const server = http.createServer((req, res) => {});

//Socket io for sending base 64 to another server.
var socket = require('socket.io')(server);

//Dependency for manage all url parsing.
const url = require('url');

//Dependency for covert a binary to a base 64.
var btoa = require('btoa');

//Liveview encoding useful vars.
var CRA_LIVEVIEW_MAX_RECEIVE_SIZE = 500000;
var CRA_LIVEVIEW_COMMON_HEADER_SIZE = 8;
var CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE = 128;

//Variable where the current base 64 image will be located.
var currentBase64Image;

/**
* Sends the proper command to the Sony Camera for starting the liveview.
* @returns {Promise} Returns the server response liveViewUrl if the request
* was succesful or an error if was not.
*/
function startLiveview() {
  return new Promise(function(resolve, reject){
    var message = JSON.stringify({
        "method": "startLiveview",
        "params": [],
        "id": 1,
        "version": "1.0"
    });

    var options = {
        host: '192.168.122.1',
        port: 10000,
        path: '/sony/camera',
        method: 'POST'
    };

    var httpreq = http.request(options, function (response) {
      response.on('data', function (responseData) {
        //console.log("response: " + responseData);
        var liveviewUrl = JSON.parse(responseData.toString()).result;
        resolve(liveviewUrl);
      });
    });

    //Manege sony camera server errors.
    httpreq.on('error', function (e) {
      reject(e);
      console.log(`Error: ${e}`);
    });

    //Manage sony camera server timeout
    httpreq.on('timeout', function () {
    reject("timeout")
    console.log('timeout');
    httpreq.abort();
    });

    httpreq.write(message);
    httpreq.end();
  });
}

/**
* Save the current liveview image (in base 64) into a string variable.
* @param {String} liveviewUrl - The URL of the liveview, this is given when the liveview start.
*/
function getLiveview(liveviewUrl) {
  var headerDecode = false;
  var offset = 0;
  var self = arguments.callee;

  var request = http.get(liveviewUrl, (res) => {
      const { statusCode  } = res;
      const contentType = res.headers['content-type'];

      let error;

      if(statusCode != 200){
        error = new Error('Resquest Failed.\n' +
                          `Status Code: ${statusCode}`);
      }

      if(error){
        console.error(error.message);
        //  Consume response data to free up memory.
        res.resume();
        return;
      }

      //Encoding that is use for browser like Google Chrome
      res.setEncoding('latin1');
      let rawData = '';

      //When the server response with the stream data.
      res.on('data', (chunk) => {
          rawData += chunk;

          //Start all the decoding code.

          //If the data received is bigger than the max, reset all and start
          //all over again.
          if(rawData.length >= CRA_LIVEVIEW_MAX_RECEIVE_SIZE){
            console.log('Reset.');
            request.abort();
            self(liveviewUrl);
          }
          //If the data received size is correct, start all the byte work to
          //decode the image.
          if(rawData.length >= (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE+offset)){
            if(headerDecode == false){
              var startByte = (rawData.charCodeAt(offset + 0) & 0xff);
              var playLoadType = (rawData.charCodeAt(offset + 1) & 0xff);
              var sequenceNumber  = (rawData.charCodeAt(offset + 2) & 0xff) << 8;
                  sequenceNumber += (rawData.charCodeAt(offset + 3) & 0xff);
              var timeStamp  = (rawData.charCodeAt(offset + 4) & 0xff) << 24;
                  timeStamp += (rawData.charCodeAt(offset + 5) & 0xff) << 16;
                  timeStamp += (rawData.charCodeAt(offset + 6) & 0xff) <<  8;
                  timeStamp += (rawData.charCodeAt(offset + 7) & 0xff);
              var startCode = [(rawData.charCodeAt(offset + 8) & 0xff), (rawData.charCodeAt(offset + 9) & 0xff), (rawData.charCodeAt(offset + 10) & 0xff), (rawData.charCodeAt(offset + 11) & 0xff)];

              var jpegSize  = ((rawData.charCodeAt(offset + 12) & 0xff) * (256 * 256));
                  jpegSize += ((rawData.charCodeAt(offset + 13) & 0xff) * 256);
                  jpegSize += ((rawData.charCodeAt(offset + 14) & 0xff));
              var paddingSize = rawData.charCodeAt(offset + 15) & 0xff;
            }

            //If the data received size corresponds to an image size, convert it to binary.
            if(rawData.length >= (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + jpegSize + offset)){
              binary = '';
              for (var i = (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset), len = (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset)+jpegSize; i < len; ++i){
                binary += String.fromCharCode(rawData.charCodeAt(i) & 0xff);
              }

              //Covert the binary to base 64.
              var base64 = btoa(binary);

              //If the base 64 size is bigger than 0, and starts with a '/'
              //This means that the base 64 decoded is an image.
              if(base64.length > 0 && base64[0] == "/"){
                currentBase64Image = base64;

                socket.emit('base64', base64);
                // console.log("###### Start Base 64 ########");
                // console.log(base64);
                // console.log("###### End Base 64 ########");

                //Seting all over to getting the following frame.
                offset = CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset + jpegSize + paddingSize;
                headerDecode = false;
                return;
              }
              //If does not satisfy the previous 'if', this means that the
              //base 64 decoded is NOT an image.
              else {
                request.abort();
                return;
              }
            }
            return;
          }

      }).on('error', (e) => {
          console.error(`Got error: ${e.message}`);
      });
  });

}

server.listen(8000, () => {
  console.log(`Server running at port: 8000`);

  //Wait until the conection between socket has been established.
  socket.on('connect', function () {
      var promise = startLiveview();
      console.log("anda");
      promise.then(function(response) {
          var liveviewUrl = url.parse(response.toString());
          console.log("Start liveview at: " + liveviewUrl.href);
          getLiveview(liveviewUrl);
      })
      promise.catch(function(error){
          console.log(error);
      })
  });
});
