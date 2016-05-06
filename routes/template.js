var router = require('express').Router();

router.get('/', function(req, res, next) {
    var data = { title: 'Page title' };
    
    res.render('ejsTemplate', data);
});

module.exports = router;
