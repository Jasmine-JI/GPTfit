var express = require('express');
var request = require("request");
var async = require('async');
const { getInfos } = require('../models/productInfo_model');

var router = express.Router();

function httpGet(url, callback) {
  const options = {
    url: url,
    json: true
  };
  request(options, function(err, res, body) {
    callback(err, body);
  });
}

router.get('/', function(req, res, next) {
  const { con, query: { device_sn } } = req;
  const sql = 'truncate table ??';
  con.query(sql, 'race_map_info', function(err, rows) {
    if (err) {
      throw err;
    }
    getInfos(device_sn).then(datas => {
      res.json(datas);
    });
  });


});




module.exports = router;
