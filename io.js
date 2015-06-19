

module.exports = function(server, app){
    var io = require('socket.io').listen(server);
    console.log('IO! oi');
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
                // arduino.write(ledOn);
                console.log('LED ON');
            } else {
                // turn off
                // arduino.write(ledOff);
                console.log('LED OFF');
            }
        });
    });

    app.set('io', io);
    app.io = io;

    return io;
};