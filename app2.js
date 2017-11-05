var express = require('express');
var app = express();
const http = require('http');
const url = require('url');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();

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

  xhr.open('GET', liveviewUrl.href, true);
  xhr.overrideMimeType('text\/plain; charset=x-user-defined');
  xhr.timeout = 500;
  xhr.ontimeout = function (e) {
    console.log("Reset");
    xhr.abort();
    self(liveviewUrl);
  };
  xhr.onreadystatechange = function() {
      if (xhr.readyState == 3) {
          if(xhr.response.length >= CRA_LIVEVIEW_MAX_RECEIVE_SIZE) {
              xhr.abort();
              self(liveviewUrl);
          }

          if(xhr.response.length >= (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE+offset)) {
              if(headerDecode == false) {
                  var jpegSize  = ((xhr.responseText.charCodeAt(offset + 12) & 0xff) * (256 * 256));
                      jpegSize += ((xhr.responseText.charCodeAt(offset + 13) & 0xff) * 256);
                      jpegSize += ((xhr.responseText.charCodeAt(offset + 14) & 0xff));
                  var paddingSize = xhr.responseText.charCodeAt(offset + 15) & 0xff;
              }

              if(xhr.response.length >= (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + jpegSize + offset)) {
                  binary = '';
                  for (var i = (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset), len = (CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset)+jpegSize; i < len; ++i) {
                      binary += String.fromCharCode(xhr.responseText.charCodeAt(i) & 0xff);
                  }

                  //var base64 = new Buffer(binary).toString('base64');
                  var base64 = window.btoa(binary);
                  if (base64.length > 0 && base64[0] == "/") {
                      currentBase64Image = "data:image/jpeg;base64," + base64;
                      console.log("#######Start base 64########");
                      console.log(currentBase64Image);
                      console.log("#######End base 64########");
                      offset = CRA_LIVEVIEW_COMMON_HEADER_SIZE + CRA_LIVEVIEW_PLAYLOAD_HEADER_SIZE + offset + jpegSize + paddingSize;
                      headerDecode = false;
                      return;
                  } else {
                      console.log('What is this?');
                      xhr.abort();
                      return;
                  }
              }
              return;
          }
      }
  };
  xhr.send();
}

//NODE SERVER PART.
app.get('/startLiveview', function (req, res) {
  var promise = startLiveview();
  promise.then(function(response) {
    var liveviewUrl = url.parse(response.toString());
    console.log("Start liveview at: " + liveviewUrl.href);
    getLiveview(liveviewUrl);
  })
  promise.catch(function(error){
    console.log(error);
  })

});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
