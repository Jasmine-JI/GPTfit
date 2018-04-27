var express = require('express');
var request = require("request");
var async = require('async');
const { getMapList } = require('../models/map_model');

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
  getMapList().then(mapLists => {
    const { datas, urls } = mapLists;
    async.map(urls, httpGet, function(err, response) {
      if (err) return console.log(err);
      const maps = response.map((_res, idx) => {
        const {
          map: {
            buildMap: { info },
            raceRoom,
            basic
          }
        } = _res;
        datas[idx].imgUrl += info[0].FileName1080p;
        datas[idx].left_top_coordinate = info[0].leftTopCoordinateLat;
        datas[idx].right_bottom_coordinate = info[0].rightBottomCoordinateLat;
        datas[idx].max_lap_limit = raceRoom.info[0].raceLap;
        datas[idx].map_name = basic.info[0].mapName;
        return info[0].FileName1080p;
      });
      res.json(datas);
    });
  });

});




module.exports = router;
