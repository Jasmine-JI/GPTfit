const express = require('express');
const router = express.Router();
const fs = require('fs');
const FormData = require('form-data');

let uploaded = false;

router.post('/', function (req, res, next) {
  const {
    con,
    body
  } = req;

  fs.writeFile(`/tmp/${body.fileName}`, JSON.stringify(body.data), (err) => {
    if (err) {
      uploaded = false;
    } else {
      console.log('Create file success. Next to upload file.');

      const uploadData = [{
        fileName: body.fileName,
        userId: body.userId,
        groupId: '',
        deviceId: ''
      }];

      const form = new FormData();
      form.append('token', body.token);
      form.append(
        'file',
        fs.createReadStream(`/tmp/${body.fileName}`)
      );
      form.append('uploadData', JSON.stringify(uploadData));

      let host,
          errMsg;
      switch (body.hostname) {
        case 'cloud.alatech.com.tw':
        case '152.101.90.130':
          host = '127.0.0.1';
          break;
        default:
          host = '192.168.1.234';
          break;
      }

      form.submit({
        host: host,
        port: 5555,
        path: '/api/v2/sport/uploadSportData',
        headers: {
          'Accept': 'multipart/form-data',
          'Accept-Encoding': 'gzip/deflate',
          'chartset': 'utf-8',
          'Authorization': 'required',
          'deviceType': '2',
          'deviceName': 'Alatech',
          'deviceOSVersion': 'Linux',
          'deviceID': 'IMEIxxxxxxx',
          'appVersionCode': '1.0.0',
          'appVersionName': '1.0.0',
          'language': 'zh',
          'regionCode': 'TW',
          'appName': 'AlaCenter',
          'equipmentSN': body.data.fileInfo.equipmentSN
        }

      }, (err, result) => {
        if (err) {
          uploaded = false;
          errMsg = err;
        } else {
          uploaded = true;

          fs.unlink(`/tmp/${body.fileName}`, () => {
            console.log('Delete File success');
          });
        }

      });

      setTimeout (() => {
        if (uploaded === true) {
          return res.json({
            resultCode: "200",
            resultMessage: "Upload sport file success.",
            msgCode: "2001",
            nodejsApiCode: "N2101"
          });
        } else {
          return res.json({
            resultCode: "400",
            resultMessage: "Upload sport file failed.",
            msgCode: "4002",
            nodejsApiCode: "N2101",
            errMsg: errMsg
          });
        }
      }, 2000);

    }

  })

});

module.exports = router;
