const express = require('express');
const router = express.Router();
const fs = require('fs');
const request = require('request');

let uploaded = false;

router.post('/', function (req, res, next) {
  const {
    con,
    body
  } = req;

  fs.writeFile(`/tmp/${body.fileName}`, JSON.stringify(body.data), (err) => {
    if (err) {
      uploaded = false;
      return res.json({
        resultCode: 400,
        resultMessage: "Upload sport file failed.",
        nodejsApiCode: "N2101",
        errMsg: "Write File failed."
      });
    } else {
      const uploadData = [{
        fileName: body.fileName,
        userId: body.userId,
        groupId: '',
        deviceId: ''
      }];

      const formData = {
        token: body.token,
        uploadData: JSON.stringify(uploadData),
        file: fs.createReadStream(`/tmp/${body.fileName}`)
      };

      let host;
      switch (body.hostname) {
        case 'cloud.alatech.com.tw':
        case 'www.gptfit.com':
        case '152.101.90.130':
          host = '127.0.0.1';
          break;
        default:
          host = '192.168.1.234';
          break;
      }

      const optons = {
        url: `http://${host}:5555/api/v2/sport/uploadSportData`,
        method: 'POST',
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
        },
        formData: formData
      };

      request(optons, (err, response, body) => {
        if (err) {
          return res.json({
            resultCode: 400,
            resultMessage: "Upload sport file failed.",
            nodejsApiCode: "N2101",
            errMsg: "Connect failed."
          });
        } else {
          const {resultCode, resultMessage} = JSON.parse(body);
          if (resultCode !== 200) {
            return res.json({
              resultCode: 400,
              resultMessage: "Upload sport file failed.",
              nodejsApiCode: "N2101",
              errMsg: resultMessage
            });
          } else {
            return res.json({
              resultCode: 200,
              resultMessage: "Upload sport file success.",
              msgCode: 2001,
              nodejsApiCode: "N2101"
            });

          }

        }

      });

    }

  })

});

module.exports = router;
