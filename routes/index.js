var express = require('express');
var router = express.Router();



/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'CIU330', baseUrl: req.app.get('baseUrl') });
});

module.exports = router;
