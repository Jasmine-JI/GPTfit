var mysql = require("mysql");
var express = require('express');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
var os = require('os');
// const https = require('https');
// const fs = require('fs');

// const SERVER_CONFIG = {
//   key: fs.readFileSync('key/private.key'),
//   cert: fs.readFileSync('key/server.crt')
// };

// Init app
var app = express();

var address,
  ifaces = os.networkInterfaces();
for (var dev in ifaces) {
  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address : undefined);
}
var connectInfo = {};
if (address === '192.168.1.235') {
  connectInfo = {
    host: "localhost",
    user: "root",
    password: "1234",
    database: "alatech",
    multipleStatements: true
  };
} else if (address === '192.168.1.234' || address === '192.168.1.232') {
  connectInfo = {
    host: "localhost",
    user: "root",
    password: "A1atech",
    database: "alatech",
    multipleStatements: true
  };
} else {
  connectInfo = {
    host: "192.168.0.2",
    user: "root",
    password: "A1atech",
    database: "alatech",
    multipleStatements: true
  };
}
console.log('address: ', address);
var connection = mysql.createConnection(connectInfo);

connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log('Connected to MySql');

});

function scheduleCronstyle() {
  schedule.scheduleJob('00 00 06 * * *', function () { // 每日早上六點
    var now = new Date();
    var now_mill = now.getTime();
    const update_time = Math.round(now_mill / 1000);
    const sql = "TRUNCATE TABLE ??";
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
      SELECT user_id,
      map_id,
      FROM_UNIXTIME(time_stamp, "%Y-%m-%d") as date,
      MIN(activity_duration) AS min_duration
      FROM race_data
      WHERE
      user_race_status = 3
      and
      activity_distance IS NOT NULL
      AND activity_duration IS NOT NULL
      and
      map_id is not null
      GROUP BY
      user_id,
      FROM_UNIXTIME(time_stamp, "%Y-%m-%d"),
      map_id
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

    connection.query(sql, 'run_rank', function (err, rows) {
      if (err) {
        throw err;
      }
      connection.query(sql2, 'run_rank', function (err, rows) {
        if (err) {
          throw err;
        }
        console.log('complete update!!');
      });
    });
  });
}
scheduleCronstyle();

// Body parser middleware

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// parse application/json
app.use(bodyParser.json())

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
    allowedOrigins = ['http://192.168.1.235', 'http://192.168.1.235:8080'];
  } else if (address === '192.168.1.234') {
    allowedOrigins = ['http://192.168.1.234', 'http://alatechapp.alatech.com.tw', 'http://192.168.1.235:8080'];
  } else if (address === '192.168.1.232') {
    allowedOrigins = ['http://192.168.1.232'];
  } else {
    allowedOrigins = [
      'http://alatechcloud.alatech.com.tw',
      'http://152.101.90.130',
      'http://192.168.1.235:8080'
    ];
  }
  var origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// Set routes

var rankForm = require('./server/routes/rankForm.js');
var resetPassword = require('./server/routes/resetPassword.js');
var raceEnroll = require('./server/routes/raceEnroll.js');
var raceEventInfo = require('./server/routes/raceEventInfo.js');
var runGpx = require('./server/routes/runGpx.js');
var deviceLog = require('./server/routes/deviceLog.js');

app.use('/nodejs/api/rankForm', rankForm);
app.use('/nodejs/api/resetPassword', resetPassword);
app.use('/nodejs/api/raceEnroll', raceEnroll);
app.use('/nodejs/api/raceEventInfo', raceEventInfo);
app.use('/nodejs/api/gpx', runGpx);
app.use('/nodejs/api/deviceLog', deviceLog);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Server running at ' + port);
});
// https server
// https.createServer(SERVER_CONFIG, app).listen(3000, function() {
//   console.log('HTTPS sever started at ' + port);
// });
