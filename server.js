/////////////////////////////////////////////////////////////////////////////
//YUNSOCKET                                                                //
//nodejs, serialport and socket.io to create a webserver on the arduino Yun//
//and have full controll of the arduino chip through an online interface.  //
//Created By fito_segrera                                                  //
//web: fii.to                                                              //
/////////////////////////////////////////////////////////////////////////////

////////////////////////
/// Required Modules ///
////////////////////////
var http = require('http');
var fs = require('fs');
var io = require('socket.io').listen(9001);
var index = fs.readFileSync(__dirname+'./index.html');//read index.html using the __dirname variable

var parsers = require('serialport').parsers;
var SerialPort = require('serialport').SerialPort;

/////////////////////////////////////////
//// Declare Serial Port for arduino ////
/////////////////////////////////////////
//This is the default serial port used internally by the arduino Yun
var sPort = '/dev/ttyATH0';
arduino = new SerialPort(sPort, {
    baudrate: 115200,
    'parser': parsers.readline('\r\n')
});

///////////////////////////
//// Create the server ////
///////////////////////////
var app = http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(index);
});



///////////////////////////
///// init socket.io //////
///////////////////////////
io.sockets.on('connection', function(socket) {
    socket.on('led', function(data) {
        // sending binary data
        console.log('CLICK!');
        var ledOn = new Buffer(1); // Buffer is an array and Buffer(1) means 1 index array
        var ledOff = new Buffer(1);
        ledOn[0] = 0x01; // 1
        ledOff[0] = 0x00; // 0

        if(data === true) {
            // turn on
            arduino.write(ledOn);
            console.log('LED ON');
        } else {
            // turn off
            arduino.write(ledOff);
            console.log('LED OFF');
        }
    });
});

var receivedData, sendData;

arduino.on('open', function() {
    console.log('PORT OPEN!');
    arduino.isOpen = true;
});

////////////////////////
///// receive data /////
////////////////////////
arduino.on('data', function(data) {
    console.log(data.toString()); //Uncomment for debugging
    io.sockets.emit('sensor', data.toString());
});

app.listen(8000);