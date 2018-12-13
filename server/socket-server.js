const express = require('express');
const http = require('http');
var WebSocket = require('ws');

const app = express();
const https = require('https');
const fs = require('fs');
const SERVER_CONFIG = {
  key: fs.readFileSync('/etc/ssl/free.key'),
  // ca: fs.readFileSync('/etc/ssl/free_ca.crt'),
  cert: fs.readFileSync('/etc/ssl/free.crt')
};
// const SERVER_CONFIG = {
//   key: fs.readFileSync('/home/administrator/myWorkSpace/130/server.key'),
//   cert: fs.readFileSync('/home/administrator/myWorkSpace/130/server.crt')
// };
//initialize a simple http server
// const server = http.createServer(app);
const httpsServer = https.createServer(SERVER_CONFIG);
httpsServer.listen(process.env.PORT || 3002, function () {
  console.log('HTTPS sever started at ' + httpsServer.address().port);
});

//initialize the WebSocket server instance
let wss = new WebSocket.Server({
  server: httpsServer
});



// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      console.log('!!!!!!');
      client.send(data);
    }
  });
};
reconnectInterval();
function reconnectInterval() {
  wss.on('connection', function connection(ws) {
    console.log('connect~~');
    ws.on('close', function () {
      console.log('socket close');
      // clearInterval(this.socketTimer);
      ;
      // reconnectInterval();
      setTimeout(() => ws.terminate(), 1000);
    });
      const max = 180;
      const min = 70;
      var test_res = {
        classId: '1',
        coach: 'party',
        description: 'Beaty Body',
        classType: '1',
        classIcon: '',
        className: '',
        token: 'a213ad211607c30ba842dbc53b02e8eb',
        classStatus: '1',
        classMemberInfo: [{
            userName: 'vincent',
            userId: 56,
            equipmentSN: 'A36WB001D0121',
            dataIndex: [{
                index: 1,
                dataFormat: '129',
                value: Math.floor(Math.random() * (max - min + 1)) + min
              },
              {
                index: 2,
                dataFormat: '161',
                value: Math.floor(Math.random() * (max - min + 1)) + min
              },
              {
                index: 3,
                dataFormat: '113',
                value: Math.floor(Math.random() * (max - min + 1)) + min
              }
            ],
            groupId: '',
            userIcon: ''
          },
          {
            userName: 'shingjia',
            userId: 58,
            equipmentSN: 'A36WB001D0123',
            dataIndex: [{
                index: 1,
                dataFormat: '129',
                value: Math.floor(Math.random() * (max - min + 1)) + min
              },
              {
                index: 2,
                dataFormat: '161',
                value: Math.floor(Math.random() * (max - min + 1)) + min
              },
              {
                index: 3,
                dataFormat: '113',
                value: Math.floor(Math.random() * (max - min + 1)) + min
              }
            ],
            groupId: '',
            userIcon: ''
          }
        ],
        classViewer: 'False',
        location: 'TW'
      };
    ws.on('message', function incoming(data) {

      if (JSON.parse(data).classViewer === '2') {
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            console.log('test_res num: ', test_res.classMemberInfo.length);
            test_res.classMemberInfo.map((_res, id) => {
              return _res.dataIndex = [{
                  index: 1,
                  dataFormat: '129',
                  value: Math.floor(Math.random() * (max - min + 1)) + min
                },
                {
                  index: 2,
                  dataFormat: '161',
                  value: Math.floor(Math.random() * (max - min + 1)) + min
                },
                {
                  index: 3,
                  dataFormat: '113',
                  value: Math.floor(Math.random() * (max - min + 1)) + min
                }
              ];
            });
            return client.send(JSON.stringify(test_res));
          }
        });
      } else {
        let idx = Number(+test_res.classMemberInfo.length);
        console.log('idx', idx);
        // let finalIdx = Number(+JSON.parse(data).memberAddNum + test_res.classMemberInfo.length);
        let finalIdx = Number(+JSON.parse(data).memberAddNum + test_res.classMemberInfo.length);
        console.log('+JSON.parse(data): ', data);

        console.log('finalIdx: ', finalIdx);
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            for (; idx < finalIdx; idx++) {
              const userName = makeName();
              const equipmentSN = makeName('sn');
              test_res.classMemberInfo[idx] = {
                userName,
                userId: 58,
                equipmentSN,
                dataIndex: [{
                    index: 1,
                    dataFormat: '129',
                    value: Math.floor(Math.random() * (max - min + 1)) + min
                  },
                  {
                    index: 2,
                    dataFormat: '161',
                    value: Math.floor(Math.random() * (max - min + 1)) + min
                  },
                  {
                    index: 3,
                    dataFormat: '113',
                    value: Math.floor(Math.random() * (max - min + 1)) + min
                  }
                ],
                groupId: '',
                userIcon: ''
              }
            }
            // console.log('test_res: ', test_res);
            return client.send(JSON.stringify(test_res));
          }
        })
      }
    });
  });
}

function makeName(type) {
  if (type === 'sn') {
    weekNum =  Math.floor(Math.random() * (52 - 1 + 1)) + 1;
    snfinalNum = Math.floor(Math.random() * (9999 - 1 + 1)) + 1;
    if (snfinalNum < 10) {
      snfinalNumText = '000' + snfinalNum;
    } else if (snfinalNum < 100) {
      snfinalNumText = '00' + snfinalNum;
    } else if (snfinalNum < 1000) {
      snfinalNumText = '0' + snfinalNum;
    } else {
      snfinalNumText = snfinalNum.toString();
    }
    if (weekNum < 10) {
      weekNumText = '0' + weekNum;
    } else {
      weekNumText = weekNum.toString();
    }
    var sn = "A" + weekNumText + "WB001D" + snfinalNumText;
    console.log('sn: ', sn);
    return sn;
  } else {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz";

    const max = 6;
    const min = 3;
    const nameLength = Math.floor(Math.random() * (max - min + 1)) + min;
    for (var i = 0; i < nameLength; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    console.log('userName: ', text);

    return text;
  }

}

//start our server
// server.listen(process.env.PORT || 3002, () => {
//   console.log(`Server started on port ${server.address().port} :)`);
// });
