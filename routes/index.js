var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Express', host: 'sensuino.local' });
});


var data;
router.post('/rfid', function(req, res){
    console.log(req.body);

    var cardCode = req.body.cc;
    var facilityCode = req.body.fc;
    var binary = req.body.bn;

    var payload = {
        cardCode: cardCode,
        facilityCode: facilityCode,
        binary: binary
    };
    router.app.io.sockets.emit('/rfid', payload);

    res.send(200).end();
});

router.get('/rfid', function(req, res){
    var cardCode = req.query.cc;
    var facilityCode = req.query.fc;
    var binary = req.query.bn;

    var payload = {
        cardCode: cardCode,
        facilityCode: facilityCode,
        binary: binary
    };

    res.render('index', {
        title: 'RFID Reader',
        host:'sensuino.local',
        cardCode: cardCode,
        facilityCode: facilityCode,
        binary: binary
    });
    router.app.io.sockets.emit('/rfid', payload);
});

module.exports = function(app){
    app.use('/', router);
    router.app = app;
};
