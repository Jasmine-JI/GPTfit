var express = require('express');
var bodyParser = require('body-parser');
var os = require('os');
var moment = require('moment');
var schedule = require('node-schedule');
const helmet = require('helmet');
const {
  checkTokenExit
} = require('./models/auth.model');
var { getUserActivityInfo } = require('./models/officialActivity_model');

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
  SERVER_CONFIG.cert = fs.readFileSync('/etc/ssl/130/offical_130.crt');
}


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


// Init app
var app = express();
var connection = require('./models/connection_db');

// Body parser middleware

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: true
}))
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
  // res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, token, Authorization, X-Auth-Token, X-XSRF-TOKEN, X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Access-Control-Allow-Headers");

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

var rankForm = require('./routes/rankForm.js');
var resetPassword = require('./routes/resetPassword.js');
var raceEnroll = require('./routes/raceEnroll.js');
var raceEventInfo = require('./routes/raceEventInfo.js');
var runGpx = require('./routes/runGpx.js');
var deviceLog = require('./routes/deviceLog.js');
var coach = require('./routes/coach.js');
var map = require('./routes/map.js');
var qrPair = require('./routes/qrPair.js');
var user = require('./routes/user.js');
var center = require('./routes/center.js');
var uploadFile = require('./routes/uploadFile.js');
var sport = require('./routes/sport.js');
var auth = require('./routes/auth.js');
var uploadSportFile = require('./routes/uploadSportFile.js');
var officialActivity = require('./routes/officialActivity.js');
var group = require('./routes/group.js');

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
app.use('/nodejs/api/user', user);
app.use('/nodejs/api/center', authMiddleware, center);
app.use('/nodejs/api/uploadFile', authMiddleware, uploadFile);
app.use('/nodejs/api/sport', authMiddleware, sport);
app.use('/nodejs/api/auth', auth);
app.use('/nodejs/api/uploadSportFile', uploadSportFile);
app.use('/nodejs/api/officialActivity', officialActivity);
app.use('/nodejs/api/group', group);
app.use('/nodejs/img', express.static('/tmp/official-activity-img'));


// Start the server
const port = process.env.PORT || 3001;

 app.listen(port, function () {
   console.log('Server running at ' + port);
 });
/*
https.createServer(SERVER_CONFIG, app).listen(port, function() {
  console.log('HTTPS sever started at ' + port);
});
*/
