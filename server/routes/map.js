var express = require('express');
var request = require("request");
var async = require('async');
const { getMapList } = require('../models/map_model');

var router = express.Router(),
    routerProtected = express.Router();

function httpGet(url, callback) {
  const options = {
    url: url,
    json: true
  };
  request(options, function(err, res, body) {
    callback(err, body);
  });
}
router.get('/mapUrl', function(req, res, next) {
  const { con } = req;
  const sql = 'select img_url from ??';
  con.query(sql, 'race_map_info', function(err, rows) {
    rows = rows.map(_row => _row.img_url);
    res.json(rows);
  });
});

router.get('/gpxUrl', function(req, res, next) {
  const { con } = req;
  const sql = 'select map_index as id , gpx_url as gpxData from ??';
  con.query(sql, 'race_map_info', function(err, rows) {
    res.json(rows);
  });
});

routerProtected.get('/', function (req, res, next) {
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
          gpx_url,
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
          datas[idx].img_url = datas[idx].img_url.replace('127.0.0.1', 'cloud.alatech.com.tw');
          datas[idx].gpx_url = datas[idx].gpx_url.replace('127.0.0.1', 'cloud.alatech.com.tw');
          // datas[idx].img_url = datas[idx].img_url.replace('127.0.0.1', 'www.gptfit.com');
          // datas[idx].gpx_url = datas[idx].gpx_url.replace('127.0.0.1', 'www.gptfit.com');
          datas[idx].img_url += info[0].FileName1080p.replace('1080', 'web_bg');
          datas[idx].gpx_url += info[0].GPXName;
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

module.exports = {
  protected: routerProtected,
  unprotected: router
};
