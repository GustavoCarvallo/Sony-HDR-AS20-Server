var express = require('express');
var app = express();
const http = require('http');
const url = require('url');

//Liveview encoding useful vars.
var CRA_LIVEVIEW_MAX_RECEIVE_SIZE = 500000;
var CRA_LIVEVIEW_COMMON_HEADER_SIZE = 8;
var CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE = 128;

//Variable where the current base 64 image will be located.
var currentBase64Image;

/**
* Sends the proper command to the Sony Camera for starting the live view.
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
        var liveViewUrl = JSON.parse(responseData.toString()).result;
        resolve(liveViewUrl);
      });
    });

    //Manege sony camera server errors.
    httpreq.on('error', function (e) {
      reject(e);
      console.log(e);
    });

    //Manege sony camera server timeout
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
* Save the current live view image (in base 64) into a string variable.
* @param {String} liveviewUrl - The URL of the liveview, this is given when the liveview start.
*/
function getLiveview(liveviewUrl) {
  var headerDecode = false;
  var offset = 0;
  var self = arguments.callee;

  var options = {
      host: liveviewUrl.hostname,
      port: liveviewUrl.port,
      path: liveviewUrl.path,
      method: 'GET',
      timeout: 500
  };

  var httpreq = http.request(options, function (response) {
    response.on('data', function (responseDataObject) {
      //console.log(responseDataObject);
      var responseData = responseDataObject.toString();

      if(responseData.length >= CRA_LIVEVIEW_MAX_RECEIVE_SIZE){
        //httpreq.abort();
        httpreq.end();
        self(liveviewUrl);
      }
      if(responseData.length >= (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset)){
        if(headerDecode == false){
          var jpegSize  = ((responseData.charCodeAt(offset + 12) & 0xff) * (256 * 256));
              jpegSize += ((responseData.charCodeAt(offset + 13) & 0xff) * 256);
              jpegSize += ((responseData.charCodeAt(offset + 14) & 0xff));
          var paddingSize = responseData.charCodeAt(offset + 15) & 0xff;
        }
        if (responseData.length >= (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + jpegSize + offset)) {
          binary = '';
          for(var i = (CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset), len = (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset) + jpegSize; i < len; ++i){
            binary += String.fromCharCode(responseData.charCodeAt(i) & 0xff);
          }
          //var base64 = window.btoa(binary);
          var base64 = new Buffer(binary).toString('base64');
          if(base64.length > 0 && base64[0] == "/"){
            var currentBase64Image = "data:image/jpeg;base64," + base64;
            console.log(currentBase64Image);
          }
          else {
            console.log("I dont know what happen!");
          }
        }
        return;
      }
    }
  );
  });

  //Manege sony camera server errors.
  httpreq.on('error', function (e) {
    console.log(e);
  });

  //Manege sony camera server timeout
  httpreq.on('timeout', function () {
    console.log("Reset");
    //httpreq.abort();
    httpreq.end();
    self(liveviewUrl);
  });

  // httpreq.write(message);
  httpreq.end();
}

//NODE SERVER PART.
app.get('/startLiveview', function (req, res) {
  var promise = startLiveview();
  promise.then(function(response) {
    var liveviewUrl = url.parse(response.toString());
    getLiveview(liveviewUrl);
  })
  promise.catch(function(error){
    console.log(error);
  })

});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
