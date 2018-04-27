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
  const { con } = req;
  const sql = 'truncate table ??';
  con.query(sql, 'race_map_info', function(err, rows) {
    if (err) {
      throw err;
    }
    getMapList().then(mapLists => {
      const sql2 = `insert into ?? (
          map_index,
          race_total_distance,
          race_elevation,
          race_average_incline,
          img_url,
          left_top_coordinate,
          right_bottom_coordinate,
          max_lap_limit,
          map_name
      ) values ?
        `;
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
          datas[idx].img_url += info[0].FileName1080p;
          datas[idx].left_top_coordinate = info[0].leftTopCoordinateLat;
          datas[idx].right_bottom_coordinate = info[0].rightBottomCoordinateLat;
          datas[idx].max_lap_limit = raceRoom.info[0].raceLap;
          datas[idx].map_name = basic.info[0].mapName;
          return info[0].FileName1080p;
        });
        const results = datas.map(_data => Object.values(_data));
        con.query(sql2, ['race_map_info', results], function(err, rows) {
          if (err) {
            throw err;
          }
        });
        console.log('complete update!!');
        res.json(datas);
      });
    });
  });


});




module.exports = router;
