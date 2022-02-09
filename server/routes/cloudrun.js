const express = require('express');
const async = require('async')
const router = express.Router();
const fs = require('fs');
const moment = require('moment');

/**
 * 取得例行賽事列表及所有地圖資訊
 * @author kidin-1100319
 */
router.post('/getAllMapInfo', (req, res, next) => {
  const resInfo = {
    list: [],
    leaderboard: []
  }

  // 先讀地圖列表json檔
  fs.readFile('/var/www/html/app/public_html/cloudrun/update/mapList.json', (err, data) => {
    if (err) {

      return res.json({
        resultCode: 400,
        resultMessage: 'No leaderboard file.',
        nodejsApiCode: 'C1001'
      });

    } else {
      // 取得月賽事列表，並去掉未來的賽事
      const leaderboard = fs.readFileSync('/var/www/html/app/public_html/cloudrun/leaderboardInfo/leaderboard.json'),
            leaderboardJson = JSON.parse(leaderboard.toString('utf8'));
      resInfo.leaderboard = leaderboardJson.rankType1.reverse().filter(_res => +_res.month <= +moment().format('YYYYMM'));

      // 取得所有地圖資本資訊，並與地圖列表合併為一個完整清單
      const list = JSON.parse(data.toString('utf8'));
      list.mapList.raceMapInfo.forEach((_list, _index) => {
        const { mapId, distance, incline, mapCode, mapInfo, mapName, smallFileName: mapImg } = _list;
        const mapFilePath = `/var/www/html/app/public_html/cloudrun/update/${mapInfo}`;
        let _mergeResult;
        if (!fs.existsSync(mapFilePath)) {
          _mergeResult = {
            mapId,
            distance,
            incline,
            mapImg,
            info: `Can not get file info.`,
            gpxPath: null
          };

        } else {
          data = fs.readFileSync(logFile);
          data = JSON.parse(data.toString('utf8'));
          const _info = fs.readFileSync(mapFilePath),
                _infoUtf8 = _info.toString('utf8').replace(/^\ufeff/g, ''), // 避免出現Unexpected token ﻿ in JSON at position 0 錯誤
                _infoJson = JSON.parse(_infoUtf8),
                { map: {basic: { info }, buildMap} } = _infoJson;
          _mergeResult = {
            mapId,
            distance,
            incline,
            mapImg,
            info,
            gpxPath: `v${mapCode}/${mapName}/${buildMap.info[0].GPXName}`
          };

        }

        resInfo.list.push(_mergeResult);
      });

      resInfo.list.sort((a, b) => a.mapId < b.mapId);
      return res.json({
        resultCode: 200,
        resultMessage: 'Get all map info success.',
        nodejsApiCode: 'C1001',
        resInfo
      });

    }

  });

});

/**
 * 取得指定雲跑地圖的gpx檔案，並轉成array格式
 * @author kidin-1100319
 */
router.post('/getMapGpx', (req, res, next) => {
  const { con, body } = req;
        response = {
          gpx: [],
          altitude: []
        };

  fs.readFile(`/var/www/html/app/public_html/cloudrun/update/${body.gpxPath}`, (err, data) => {
    if (err) {

      return res.json({
        resultCode: 400,
        resultMessage: 'No leaderboard file.',
        nodejsApiCode: 'C1002'
      });

    } else {
      const point = [],
            altitude = [],
            file = data.toString('utf8'),
            divideContent = file.split('</trkpt>');

      divideContent.forEach((_content, _idx) => {
        if (_idx !== divideContent.length - 1) {
          const latSection = _content.split('lat="')[1].replace(/\s/g, ''),
                lat = latSection.split('"lon=')[0],
                lon = _content.split('lon="')[1].split('"')[0],
                alt = _content.split('<ele>')[1].split('</ele>')[0];

          point.push([+lat, +lon]);
          altitude.push(+alt);
        }

      });

      return res.json({
        resultCode: 200,
        resultMessage: 'Get GPX file success.',
        nodejsApiCode: 'C1002',
        info: {
          point,
          altitude
        }

      });

    }

  });

});

module.exports = router;