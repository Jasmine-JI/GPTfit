var mysql = require("mysql");
var express = require('express');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
// Init app
var app = express();

var connection = mysql.createConnection({
  host: "192.168.0.2",
  user: "root",
  password: "A1atech",
  database: "alatech",
  multipleStatements: true
});
connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log('Connected to MySql');

});

function scheduleCronstyle() {
  schedule.scheduleJob('00 00 06 * * *', function () { // 每日早上六點
    const sql = "TRUNCATE TABLE ??";
    const sql2 = `
      insert into ??
      select r1.activity_duration as offical_time,
      r1.user_id, FROM_UNIXTIME(r1.time_stamp, "%m") as month,
      FROM_UNIXTIME(r1.time_stamp, "%Y-%m-%d") as date, r1.map_id ,
      r1.file_name, p.gender, p.nick_name, p.e_mail, m.map_name,
      m.race_category, m.race_total_distance
      from race_data r1,
      user_profile as p,
      race_map_info as m
      where user_race_status = 3
      and
      activity_duration = (select min(r2.activity_duration)
      from race_data r2 where user_race_status = 3 and
      r1.map_id = r2.map_id
      and
      r1.user_id = r2.user_id
      and
      FROM_UNIXTIME(r1.time_stamp, "%m") = FROM_UNIXTIME(r2.time_stamp, "%m"))
      and r1.user_id = p.user_id and r1.map_id = m.map_index order by user_id;
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
  res.setHeader("Access-Control-Allow-Origin", "http://152.101.90.130:4200");

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

app.use('/rankForm', rankForm);

// Start the server
const port = process.env.PORT || 3000;
// var port = 3000;
app.listen(port, function () {
  console.log('Server running at ' + port);
});
