var router = require('express').Router();

router.get('/', function(req, res, next) {
    var data = {
      title: req.app.get('appTitle'),
      baseUrl: req.app.get('baseUrl'),
      clientId: req.app.get('clientId'),
      themeColor: req.app.get('themeColor'),
      themeColorRgba: req.app.get('themeColorRgba')
    };
    
    res.render('ejsTemplate', data);
});

module.exports = router;
