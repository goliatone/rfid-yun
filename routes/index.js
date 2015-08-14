var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.redirect('/rfid');
    // res.render('index', { title: 'Express', host: 'sensuino.local' });
});

router.post('/echo', function(req, res){
    console.log(req.body);
  res.send(200);
});

var data;
router.post('/rfid', function(req, res){
    console.log(req.body);

    var cardCode = req.body.cc || 'not set';
    var facilityCode = req.body.fc || 'not set';
    var binary = req.body.bn || 'not set';

    var payload = {
        cardCode: cardCode,
        facilityCode: facilityCode,
        binary: binary
    };
    router.app.io.sockets.emit('/rfid', payload);

    res.send(200).end();
});

router.get('/rfid', function(req, res){
    var cardCode = req.query.cc || 'not set';
    var facilityCode = req.query.fc || 'not set';
    var binary = req.query.bn || 'not set';

    var payload = {
        cardCode: cardCode,
        facilityCode: facilityCode,
        binary: binary
    };
console.log('PAYLOAD', JSON.stringify(payload, null, 4));
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
