var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    var data = {
      title: 'CIU330',
      baseUrl: req.app.get('baseUrl'),
      clientId: req.app.get('clientId'),
      themeColor: req.app.get('themeColor')
    };
    
    res.render('signin', data);
});

module.exports = router;
