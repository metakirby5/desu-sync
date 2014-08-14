var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {
    title: 'DesuSync',
    css: ['index'],
    js: ['ani-up', 'services', 'index'],
    ngApp: ['desuSyncApp']
  });
});

module.exports = router;
