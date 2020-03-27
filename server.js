var mysql = require("mysql");
var express = require('express');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
var os = require('os');
const { getMapList } = require('./server/models/map_model');
var async = require('async');
var request = require('request');
const helmet = require('helmet');
const { checkTokenExit } = require('./server/models/auth.model');

const https = require('https');
const fs = require('fs');

var address,
  ifaces = os.networkInterfaces();
for (var dev in ifaces) {
  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address : undefined);
}
const SERVER_CONFIG = {
  key: null,
  ca: null,
  cert: null
};
if (address === '192.168.1.231' || address === '192.168.1.235' || address === '192.168.1.234') {
  SERVER_CONFIG.key = fs.readFileSync('/etc/ssl/free.key'),
  SERVER_CONFIG.ca = fs.readFileSync('/etc/ssl/free_ca.crt'),
  SERVER_CONFIG.cert = fs.readFileSync('/etc/ssl/free.crt');
} else {
  SERVER_CONFIG.key = fs.readFileSync('/etc/ssl/130/offical_130_no_pem.key'),
  SERVER_CONFIG.ca = fs.readFileSync('/etc/ssl/130/offical_public_130.crt'),
  SERVER_CONFIG.cert = fs.readFileSync('/etc/ssl/130/offical_130.cer');
}

// Init app
var app = express();
var connection = require('./server/models/connection_db');

const runRankTask = function () {
  schedule.scheduleJob('00 00 06 * * *', function () {
    // 每日早上六點整點更新
    var now = new Date();
    var now_mill = now.getTime();
    const update_time = Math.round(now_mill / 1000);
    const sql1 = 'CREATE TABLE ?? like ??;';
    const sql3 = 'rename table ?? to ?? , ?? to ??;';
    const sql4 = 'drop table ??;';
    const sql2 = `
      insert into ??
      select
        b.offical_time,
        b.user_id,
        b.month,
        b.date,
        b.map_id,
        b.file_name,
        p.gender,
        p.login_acc,
        p.e_mail,
        m.map_name,
        m.race_category,
        m.race_total_distance,
        p.phone,
        p.country_code,
        ${update_time}
      from (
        select distinct r2.user_id,
          r2.map_id,
          FROM_UNIXTIME(r2.time_stamp, "%Y-%m-%d") as date,
          FROM_UNIXTIME(r2.time_stamp, "%m") as month,
          r2.activity_duration as offical_time,
          r2.activity_distance,
          r2.time_stamp,
          r2.file_name
          from
          (
            SELECT r.user_id,
            r.map_id,
            FROM_UNIXTIME(r.time_stamp, "%Y-%m-%d") as date,
            MIN(r.activity_duration) AS min_duration
            FROM race_data as r,
            race_map_info as m1
            WHERE
            r.user_race_status = 3
            and
            r.activity_distance IS NOT NULL
            AND r.activity_duration IS NOT NULL
            and
            r.map_id is not null
            and
            r.activity_distance >= m1.race_total_distance * 1000
            GROUP BY
            r.user_id,
            FROM_UNIXTIME(r.time_stamp, "%Y-%m-%d"),
            r.map_id
          ) as r1
        INNER JOIN
        race_data AS r2
        ON
        r2.activity_duration = r1.min_duration
        AND
        r2.user_id = r1.user_id
        and
        r1.map_id = r2.map_id
        and
        r1.date = FROM_UNIXTIME(r2.time_stamp, "%Y-%m-%d")
        WHERE r2.user_race_status = 3
        and
        r2.activity_distance IS NOT NULL
        AND r2.activity_duration IS NOT NULL
        and
        r2.map_id is not null
      )b,
      user_profile as p,
      race_map_info as m
      where
      b.user_id = p.user_id
      and
      b.map_id = m.map_index
        and
        b.activity_distance >= m.race_total_distance * 1000
        ;
    `;
    const tasks = [
      function (callback) {
        connection.query(sql1, ['run_rank_copy', 'run_rank'], function (
          err,
          result
        ) {
          if (err) {
            console.log('1 err: ', err);
          } else {
            console.log('1', result);
            callback(err);
          }
        });
      },
      function (callback) {
        connection.query(sql2, 'run_rank_copy', function (err, result) {
          if (err) {
            console.log('2 err: ', err);
          } else {
            console.log('2', result);
            callback(err);
          }
        });
      },
      function (callback) {
        connection.query(
          sql3, ['run_rank', 'run_rank_old', 'run_rank_copy', 'run_rank'],
          function (err, result) {
            if (err) {
              console.log('3 err: ', err);
            } else {
              console.log('3', result);
              callback(err);
            }
          }
        );
      },
      function (callback) {
        connection.query(sql4, 'run_rank_old', function (err, result) {
          if (err) {
            console.log('4 err: ', err);
          } else {
            console.log('4', result);
            callback(err);
          }
        });
      }
    ];
    async.series(tasks, function (err, results) {
      if (err) {
        console.log('err', err);
        connection.rollback(); // 发生错误事务回滚
      } else {
        console.log('===============');
      }
    });
  });
};

function httpGet(url, callback) {
  const options = {
    url: url,
    json: true
  };
  request(options, function (err, res, body) {
    callback(err, body);
  });
}
const runMapTask = function () {
  schedule.scheduleJob('00 30 05 * * *', function () {
    // 每日早上五點半更新，為了避開run_rank更新
    const sql = 'TRUNCATE TABLE ??;';

    connection.query(sql, 'race_map_info', function (err, rows) {
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
        const {
          datas,
          urls
        } = mapLists;
        async.map(urls, httpGet, function (err, response) {
          if (err) return console.log(err);
          const maps = response.map((_res, idx) => {
            const {
              map: {
                buildMap: {
                  info
                },
                raceRoom,
                basic
              }
            } = _res;
            datas[idx].img_url = datas[idx].img_url.replace('127.0.0.1', 'cloud.alatech.com.tw');
            datas[idx].gpx_url = datas[idx].gpx_url.replace('127.0.0.1', 'cloud.alatech.com.tw');
            datas[idx].img_url += info[0].FileName1080p.replace('1080', 'web_bg');
            datas[idx].gpx_url += info[0].GPXName;
            datas[idx].left_top_coordinate = info[0].leftTopCoordinateLat;
            datas[idx].right_bottom_coordinate = info[0].rightBottomCoordinateLat;
            datas[idx].max_lap_limit = raceRoom.info[0].raceLap;
            datas[idx].map_name = basic.info[0].mapName;
            return info[0].FileName1080p;
          });
          const results = datas.map(_data => Object.values(_data));
          connection.query(sql2, ['race_map_info', results], function (err, rows) {

            if (err) {
              throw err;
            }
          });
          console.log('complete update!!');
        });
      });
    });
  });
};
runMapTask();
runRankTask();


// Body parser middleware

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// parse application/json
app.use(bodyParser.json())

// use helmet
app.use(helmet({
  dnsPrefetchControl: {
    allow: true
  }
}));

// Add headers
app.use(function (req, res, next) {
  req.con = connection;
  // Website you wish to allow to connect
  var address,
    ifaces = os.networkInterfaces();
  for (var dev in ifaces) {
    ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address : undefined);
  }

  var allowedOrigins = [];
  if (address === '192.168.1.235') {
    allowedOrigins = [
      'http://192.168.1.235:8080',
      'https://192.168.1.235:8080',
      'http://192.168.1.235',
      'https://192.168.1.235'
    ];
  } else if (address === '192.168.1.231') {
    allowedOrigins = [
      'http://192.168.1.231:8080',
      'https://192.168.1.231:8080',
      'http://192.168.1.231',
      'https://192.168.1.231'
    ];
  } else if (address === '192.168.1.234') {
    allowedOrigins = [
      'http://192.168.1.234',
      'http://alatechapp.alatech.com.tw',
      'http://192.168.1.235:8080',
      'http://192.168.1.231:8080',
      'http://localhost:8080',
      'http://app.alatech.com.tw',
      'https://192.168.1.234',
      'https://alatechapp.alatech.com.tw',
      'https://192.168.1.235:8080',
      'https://192.168.1.231:8080',
      'http://localhost:8080',
      'https://app.alatech.com.tw'
    ]; // 因為要for在家只做前端時，需要隨意的domain去call
  } else if (address === '192.168.1.232') {
    allowedOrigins = ['http://192.168.1.232:8080'];
  } else {
    allowedOrigins = [
      'http://alatechcloud.alatech.com.tw:8080',
      'https://alatechcloud.alatech.com.tw:8080',
      'http://alatechcloud.alatech.com.tw',
      'http://152.101.90.130:8080',
      'https://152.101.90.130:8080',
      'https://cloud.alatech.com.tw',
      'https://cloud.alatech.com.tw:8080',
      'http://cloud.alatech.com.tw:8080'
    ];
  }

  var origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  const allowHeaders = ['X-Requested-With', 'content-type', 'Authorization',
    'deviceID', 'charset', 'language', 'Accept', 'deviceType', 'deviceName',
    'deviceOSVersion', 'appVersionCode', 'appVersionName', 'regionCode', 'appName',
    'equipmentSN', 'Accept-Encoding'
  ];
  res.setHeader('Access-Control-Allow-Headers', allowHeaders.join(','));

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// authenticate middleware

const authMiddleware = function (req, res, next) {
  const token = req.headers['authorization'];
  if (token) {
    return checkTokenExit(token).then(ans => {
      if (ans) {
        next();
      } else {
        res.status(401).json({
          success: false,
          message: 'Failed to authenticate token.'
        });
      }
    });
  } else if (req.method !== 'OPTIONS') {
    return res.status(403).json({
      success: false,
      message: 'No token provided.'
    })
  } else {
    next();
  }
}

// Set routes

var rankForm = require('./server/routes/rankForm.js');
var resetPassword = require('./server/routes/resetPassword.js');
var raceEnroll = require('./server/routes/raceEnroll.js');
var raceEventInfo = require('./server/routes/raceEventInfo.js');
var runGpx = require('./server/routes/runGpx.js');
var deviceLog = require('./server/routes/deviceLog.js');
var coach = require('./server/routes/coach.js');
var map = require('./server/routes/map.js');
var qrPair = require('./server/routes/qrPair.js');
var user = require('./server/routes/user.js');
var center = require('./server/routes/center.js');
var sport = require('./server/routes/sport.js');

app.use('/nodejs/api/rankForm', rankForm.unprotected);
app.use('/nodejs/api/rankForm', authMiddleware, rankForm.protected);
app.use('/nodejs/api/resetPassword', resetPassword);
app.use('/nodejs/api/raceEnroll', authMiddleware, raceEnroll);
app.use('/nodejs/api/qrPair', qrPair);
app.use('/nodejs/api/raceEventInfo', raceEventInfo.unprotected);
app.use('/nodejs/api/raceEventInfo', authMiddleware, raceEventInfo.protected);
app.use('/nodejs/api/map', map.unprotected);
app.use('/nodejs/api/map', authMiddleware, map.protected);
app.use('/nodejs/api/gpx', authMiddleware, runGpx);
app.use('/nodejs/api/deviceLog', authMiddleware, deviceLog);
app.use('/nodejs/api/coach', authMiddleware, coach);
app.use('/nodejs/api/user', authMiddleware, user);
app.use('/nodejs/api/center', authMiddleware, center);
app.use('/nodejs/api/sport', authMiddleware, sport);


// Start the server
const port = process.env.PORT || 3000;
// app.listen(port, function () {
//   console.log('Server running at ' + port);
// });
// https server
https.createServer(SERVER_CONFIG, app).listen(3000, function() {
  console.log('HTTPS sever started at ' + port);
});
