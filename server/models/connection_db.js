var mysql = require("mysql");
var os = require('os');
const {
  sendMail
} = require('../utils/send_mail');
var moment = require('moment');

var address,
  ifaces = os.networkInterfaces();
for (var dev in ifaces) {
  ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address : undefined);
}
var connectInfo = {};
 var reconnectNum = 0;
 console.log('address: ', address);
if (address === '192.168.1.235' || address === '172.17.0.1') {
  connectInfo = {
    host: "localhost",
    user: "root",
    password: "A1atech",
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
//- Create the connection variable
//-
var connection = mysql.createPool(connectInfo);

//-
//- Establish a new connection
//-
connection.getConnection(function (err) {
  if (err) {
    // mysqlErrorHandling(connection, err);
    console.log("\n\t *** Cannot establish a connection with the database. ***");

    connection = reconnect(connection);
  } else {
    console.log("\n\t *** New connection established with the database. ***")
  }
});


//-
//- Reconnection function
//-
function reconnect(connection) {
  console.log("\n New connection tentative...");

  //- Create a new one
  connection = mysql.createPool(connectInfo);

  //- Try to reconnect
  connection.getConnection(function (err) {
    if (err) {
      //- Try to connect every 2 seconds.
      setTimeout(() => reconnect(connection), 5000);
      reconnectNum++;
      if (reconnectNum % 12 === 0) {
        const mailOptions = {
          from: 'noreply@alatech.com.tw',
          to: 'kidin_liu@alatech.com.tw;',
          subject: `${address}主機，nodejs發生錯誤囉!!`,
          text: `
              資料庫連線發生錯誤處理<br>
              at ${address}
              <br>發生於${moment().format('YYYY-MM-DD, HH:mm:ss')}`,
        };
        sendMail(mailOptions);
      }
    } else {
      console.log("\n\t *** New connection established with the database. ***");
      reconnectNum = 0;
      return connection;
    }
  });
}
// 對於非同步沒處理到的reject的處理
process.on('unhandledRejection', (reason, promise) => {
  reconnect(connection);
})

//-
//- Error listener
//-
connection.on('error', function (err) {

  //-
  //- The server close the connection.
  //-
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
    return reconnect(connection);
  } else if (err.code === "PROTOCOL_ENQUEUE_AFTER_QUIT") {
    console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
    return reconnect(connection);
  } else if (err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
    console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
    return reconnect(connection);
  } else if (err.code === "PROTOCOL_ENQUEUE_HANDSHAKE_TWICE") {
    console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
  } else {
    console.log("/!\\ Cannot establish a connection with the database. /!\\ (" + err.code + ")");
    return reconnect(connection);
  }

});


//-
//- Export
//-
module.exports = connection;
