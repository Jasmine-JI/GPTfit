var express = require('express');
var bodyParser = require('body-parser');
var os = require('os');
const helmet = require('helmet');
const {
  checkTokenExit
} = require('./models/auth.model');

// const https = require('https');
// const fs = require('fs');

// const SERVER_CONFIG = {
//   key: fs.readFileSync('../key/private.key'),
//   cert: fs.readFileSync('../key/server.crt')
// };

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
  if (address === '192.168.1.235' || address === '172.17.0.1') {
    allowedOrigins = ['http://192.168.1.235:8080', '*'];
  } else if (address === '192.168.1.234') {
    allowedOrigins = ['*']; // 因為要for在家只做前端時，需要隨意的domain去call
  } else if (address === '192.168.1.232') {
    allowedOrigins = ['http://192.168.1.232:8080'];
  } else {
    allowedOrigins = [
      'http://alatechcloud.alatech.com.tw:8080',
      'http://152.101.90.130:8080',
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
    'deviceID', 'chartset', 'language', 'Accept', 'deviceType', 'deviceName',
    'deviceOSVersion', 'appVersionCode', 'appVersionName', 'regionCode', 'appName'
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

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, function () {
  console.log('Server running at ' + port);
});
// https.createServer(SERVER_CONFIG, app).listen(port, function() {
//   console.log('HTTPS sever started at ' + port);
// });
