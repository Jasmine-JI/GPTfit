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
  const { query: { device_sn } } = req;
  getInfos(device_sn).then(datas => {
    res.json(datas);
  }, err => {
    console.log(err);
    res.status(500).json({
      Error: err
    })
  });
});




module.exports = router;
