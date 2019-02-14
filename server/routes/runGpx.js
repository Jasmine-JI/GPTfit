var express = require('express');
var fs = require('fs');

var router = express.Router();
var writeGpx = require('../models/write_gpx');

var formidable = require('formidable');
const writeCloudRunGpx = require('../models/gpx-transform-baidu').writeCloudRunGpx;
var moment = require('moment');

router.get('/make', function (req, res, next) {
  const {
    con,
    query: {
      md5_unicode
    }
  } = req;
  const sql = `
    select r.longitude, r.latitude, r.altitude, r.utc,
    r.heart_rate, r.cadence, r.pace, r.calorie, r.incline,
    s.file_name from ?? r, sport as s
    where r.md5_unicode = ?
    and
    r.md5_unicode = s.md5_unicode
  ;
  `;

  con.query(sql, ['real_time_activity', md5_unicode], function (err, rows) {
    if (err) {
      console.log(err);
    }

    writeGpx(rows, fs).then((response) => {
      if (response === true) {
        return res.json(rows);
      }
    });
  });
});

router.post('/download', (req, res) => {
  // FILEPATH 填入要被下載檔案的路徑
  // FILENAME 無所謂，因為會被 Angular 定義的新名稱蓋掉
  res.download('/var/www/html/dist/test.gpx', `${moment().format('YYYYMMDDHHmm')}_test.gpx`, err => {
    if (err) {
      res.send(err);
    } else {
      console.log('success');
    }
  });
});
router.post('/upload', (req, res, next) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    const path = files.file.path; // 第二個file是formData的key名
    const {
      toFormat,
      fromFormat
    } = fields;
    return writeCloudRunGpx(path, fromFormat, toFormat, res);
  });
});
// Exports
module.exports = router;
