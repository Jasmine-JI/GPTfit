var mysql = require("mysql");
var express = require('express');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
var os = require('os');
var moment = require('moment');
const { getMapList } = require('./server/models/map_model');
var async = require('async');
var request = require('request');
const helmet = require('helmet');
const { checkTokenExit } = require('./server/models/auth.model');
var { getUserActivityInfo } = require('./server/models/officialActivity_model');

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
  SERVER_CONFIG.key = fs.readFileSync('/etc/ssl/130/second_certs/offical_130_no_pem.key'),
  SERVER_CONFIG.ca = fs.readFileSync('/etc/ssl/130/second_certs/offical_public_130.crt'),
  SERVER_CONFIG.cert = fs.readFileSync('/etc/ssl/130/second_certs/offical_130.crt');
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

            datas[idx].img_url = datas[idx].img_url.replace('127.0.0.1', 'www.gptfit.com');
            datas[idx].gpx_url = datas[idx].gpx_url.replace('127.0.0.1', 'www.gptfit.com');
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


/**
 * 官方活動排名每天凌晨三點定時更新
 * @author-kidin-1090914
 */
const runActivityRankTask = function () {
  schedule.scheduleJob('00 00 03 * * *', function () {

    const allFile = fs.readdirSync('/tmp/official-activity');
    let list = [];

    allFile.forEach((_file, index) => {
      try {
        let data = fs.readFileSync(`/tmp/official-activity/${_file}`),
            file = JSON.parse(data.toString('utf8'));

        const oneDay = 1000 * 60 * 60 * 24;
        // 活動開始後隔一天再開始自動排名，活動結束後隔一天最後一次自動排名-kidin-1090915
        if (file.startTimeStamp + oneDay < moment().valueOf() && file.endTimeStamp + oneDay > moment().valueOf()) {
          getPerGroupRank(file);
        }

      } catch (err) {
        console.log(err);
      }

    })

  });

};

/**
 * 取得各群組排名並寫入檔案
 * @param file
 * @returns file
 * @author kidin-1090911
 */
async function getPerGroupRank(file) {
  const mapId = file.mapId,
        startTimeStamp = file.startTimeStamp,
        endTimeStamp = file.endTimeStamp,
        mapDistance = file.mapDistance;

  for (let i = 0; i < file.group.length; i++) {
    file.group[i].rank = [];  // 清空排名
    let userIdArr = [];

    file.group[i].member.forEach(_member => {
      if (_member.status === 'checked') {
        userIdArr.push(_member.userId);
      }

    });

    if (userIdArr.length !== 0) {
      const query = await getUserActivityInfo(mapId.toString(), startTimeStamp, endTimeStamp, mapDistance, userIdArr).then(resp => {
        if (resp) {
          file.group[i].rank = filterData(resp);
        }

      })

    }

  }

  file = fillRanking(file);

  if (file.team.length > 0) {
    file = createTeamRanking(file);
  }

  fs.writeFile(`/tmp/official-activity/${file.fileName}.json`, JSON.stringify(file), (err) => {
    if (err) {
      console.log(`Error: Write file ${file.fileName} failed.`);
    } else {
      console.log(`Update ranking success`);
    }

  })

  const dir = '/tmp/official-activity-backup';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // 於每日排名過後備份檔案-kidin-1090928
  fs.writeFile(`/tmp/official-activity-backup/${file.fileName}${moment().format('YYYYMMDD')}.json`, JSON.stringify(file), (err) => {
    if (err) {
      console.log(`Error: Write file ${file.fileName}${moment().format('YYYYMMDD')} failed.`);
    } else {
      console.log(`Update ranking success`);
    }

  })

}

/**
 * 將參賽者成績篩選掉相同user id的排名，並確認是否有成績相同的情況
 * @param data
 * @author kidin-1090902
 */
function filterData(data) {
  const rankList = [];
  let rank = 1,
      preRecord = null;

  data.forEach((_data, index) => {
    if (!rankList.some(_list => _list.userId === _data.user_id)) {

      // 完賽時間相同則排名相同
      if (preRecord !== null && _data.total_second === preRecord) {
        rankList.push({
          ranking: data[index - 1].ranking,
          userId: _data.user_id,
          nickname: _data.login_acc,
          record: _data.total_second,
          finishDate: formatDate(+_data.creation_unix_timestamp),
          distance: _data.total_distance_meters
        });

      } else {
        preRecord = _data.total_second;

        rankList.push({
          ranking: rank,
          userId: _data.user_id,
          nickname: _data.login_acc,
          record: _data.total_second,
          finishDate: formatDate(+_data.creation_unix_timestamp),
          distance: _data.total_distance_meters
        });

      }

      rank++;
    }

  });

  return rankList;
}

/**
 * 將已報名但未上傳成績的參賽者加入排名末端
 * @param file
 * @author kidin-1090911
 */
function fillRanking(file) {
  file.group.map(_group => {
    const notFinishUser = _group.member.filter(_member => {

      if (_member.status !== 'checked') {
        return false;
      } else {

        let noRank = true;
        for (let i = 0; i < _group.rank.length; i++) {

          if (_group.rank[i].userId === _member.userId) {

            // 在排名資訊中添加team資訊以供團體排名使用
            if (file.team.length > 0) {
              Object.assign(_group.rank[i], {team: _member.team})
            }
    
            noRank = false;
          }

        }

        return noRank;
      }
      
    });

    notFinishUser.forEach(_user => {
      _group.rank.push({
        ranking: '-',
        userId: _user.userId,
        nickname: _user.nickname,
        record: 'N/A',
        finishDate: 'N/A',
        distance: 'N/A',
        team: _user.team
      });
      
    });

    return _group;
  });

  return file;
}

/**
 * 將timestamp轉為日期
 * @param timestamp
 * @author kidin-1090902
 */
function formatDate(timestamp) {
  return moment(timestamp).format('YYYY-MM-DD');
}

/**
 * 從個人排名獲取資料生成群組排名
 * @param file
 * @author kidin-1090911
 */
function createTeamRanking(file) {
  file = initialTeamMember(file);
  file = sortMember(file);

  file.team.forEach((_team, index) => {

    let peopleNum = 0,
        finishNum = 0,
        totalSecond = 0;

    if (_team.member) {
      peopleNum = _team.member.length;

      _team.member.forEach(_member => {

        if (_member.record !== 'N/A') {
          finishNum++;
          totalSecond += _member.record;
        }
        
      });
      
    }
    
    Object.assign(_team, {totalTime: totalSecond });
    Object.assign(_team, {record: Math.round(totalSecond / finishNum)});
    Object.assign(_team, {peopleNum: `${finishNum}/${peopleNum}`});
  });

  return file;
}

/**
 * 將團體的成員清空以利成員名單重新建立
 * @param file
 * @author kidin-1091005
 */
function initialTeamMember(file) {
  file.team.forEach(_team => {
    if (_team.member) {
      _team.member.length = 0;
    }

  });

  return file;
}

/**
 * 依據個人所參加的團體進行分類
 * @param file
 * @author kidin-1090930
 */
function sortMember(file) {
  file.group.forEach(_group => {
    _group.rank.forEach(_rank => {
      file.team.forEach(_team => {
        if (_rank.team === _team.teamName) {
          
          if (!_team.hasOwnProperty('member')) {
            Object.assign(_team, {member: [{
              userId: _rank.userId,
              nickname: _rank.nickname,
              record: _rank.record
            }]});

          } else {
            _team.member.push({
              userId: _rank.userId,
              nickname: _rank.nickname,
              record: _rank.record
            })

          }

        }

      });

    });

  });

  return file;
}

runActivityRankTask();


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
      'https://app.alatech.com.tw',
      'https://8080-7aaf076f-51b0-42d2-98b7-1d6f0d057f29.asia-east1.cloudshell.dev'
    ]; // 因為要for在家只做前端時，需要隨意的domain去call（cloudshell.dev這個domain為kidin用cloud shell建的開發用環境，不需要時可移除）
  } else if (address === '192.168.1.232') {
    allowedOrigins = ['http://192.168.1.232:8080'];
  } else {
    allowedOrigins = [
      'http://152.101.90.130',
      'http://152.101.90.130:8080',
      'https://152.101.90.130:8080',
      'https://cloud.alatech.com.tw',
      'https://cloud.alatech.com.tw:8080',
      'http://cloud.alatech.com.tw:8080',
      'https://www.gptfit.com',
      'https://www.gptfit.com:8080',
      'http://www.gptfit.com:8080'
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
    'equipmentSN', 'Accept-Encoding', 'utcZone'
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
var uploadSportFile = require('./server/routes/uploadSportFile.js');
var officialActivity = require('./server/routes/officialActivity.js');
var group = require('./server/routes/group.js');

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
app.use('/nodejs/api/uploadSportFile', uploadSportFile);
app.use('/nodejs/api/officialActivity', officialActivity);
app.use('/nodejs/api/group', group);
app.use('/nodejs/img', express.static('/tmp/official-activity-img'));


// Start the server
const port = process.env.PORT || 3000;
// app.listen(port, function () {
//   console.log('Server running at ' + port);
// });
// https server
https.createServer(SERVER_CONFIG, app).listen(3000, function() {
  console.log('HTTPS sever started at ' + port);
});
