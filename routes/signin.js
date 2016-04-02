var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('signin', { title: 'CIU330', baseUrl: req.app.get('baseUrl'), clientId: req.app.get('clientId') });
});

module.exports = router;
