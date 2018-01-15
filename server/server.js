var mysql = require("mysql");
var express = require('express');
var bodyParser = require('body-parser');
var os = require('os');

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
var connection = mysql.createConnection(connectInfo);

connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log('Connected to MySql');

});

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
    allowedOrigins = ['http://192.168.1.235:8080', '*'];
  } else if (address === '192.168.1.234') {
    allowedOrigins = ['*']; // 因為要for在家只做前端時，需要隨意的domain去call
  } else if (address === '192.168.1.232') {
    allowedOrigins = ['http://192.168.1.232:8080'];
  } else {
    allowedOrigins = [
      'http://alatechcloud.alatech.com.tw:8080',
      'http://152.101.90.130:8080',
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

var rankForm = require('./routes/rankForm.js');
var resetPassword = require('./routes/resetPassword.js');
var raceEnroll = require('./routes/raceEnroll.js');
var raceEventInfo = require('./routes/raceEventInfo.js');

app.use('/nodejs/api/rankForm', rankForm);
app.use('/nodejs/api/resetPassword', resetPassword);
app.use('/nodejs/api/raceEnroll', raceEnroll);
app.use('/nodejs/api/raceEventInfo', raceEventInfo);

// Start the server
const port = process.env.PORT || 3001;
app.listen(port, function () {
  console.log('Server running at ' + port);
});
