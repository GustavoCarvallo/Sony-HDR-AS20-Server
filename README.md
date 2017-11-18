# Sony-HDR-AS20-Server

The [Sony HDR-AS20](http://www.sony.com.ar/electronics/videocamaras-actioncam/hdr-as20) is an action camera of Sony as many other action cams it
does not have a display where the you can see what the camera is looking, so
another device must act as its display (usually an smartphone); this can be done
by connecting the device to the camera WiFi.
When the device is connected the camera acts as a server which can be called by
simple HTTP methods as GET and POST. In this way the device can also set different
parameters of the camera (as video quality, shoot mode, etc).  

This server is intended to hack Sony action camera HDR-AS20. This means that
the live view frame (decoded as [base 64](https://es.wikipedia.org/wiki/Base64)) could be send to another server.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

What things you need to test the software

1. Sony HDR-AS20 Camera

2. [Node JS](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed on the computer


### Installing

Follow this steps for running the software in your preferred terminal.

1. Clone the repository.

	``` bash
	git clone https://github.com/GustavoCarvallo/Sony-HDR-AS20-Server.git
	```

2.	Navigate to the directory where the repository has been cloned.

3.	Init the project.

	``` bash
	npm init
	```

4.	Install the [btoa](https://www.npmjs.com/package/btoa) dependency with [npm](https://www.npmjs.com/).

	``` bash
	npm install btoa --save
	```		

5.	Install the [socket.io](https://www.npmjs.com/package/socket.io) dependency with [npm](https://www.npmjs.com/).

	``` bash
	npm install socket.io --save
	```

6.	Connect your computer to the Sony HDR-AS20 Camera WiFi.

7.	Run the server.
	``` bash
	node server.js
	```		

## API Reference

Sony Camera Remote API beta SDK

```html
https://developer.sony.com/downloads/all/sony-camera-remote-api-beta-sdk/
```

## Built With

* [Node JS](https://nodejs.org/en/) - JavaScript runtime built on Chrome's V8 JavaScript engine
* [Socket io](https://socket.io/) - JavaScript library for realtime web applications.
* [npm](https://www.npmjs.com/) - Package manager for JavaScript
* [JSDoc](http://usejsdoc.org/index.html) - API documentation generator for Javascript
