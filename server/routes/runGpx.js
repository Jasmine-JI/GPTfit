var express = require('express');
var fs = require('fs');

var router = express.Router();
var writeGpx = require('../models/write_gpx');

router.get('/make', function(req, res, next) {
  const { con, query: { md5_unicode } } = req;
  const sql = `
select longitude,latitude, altitude, utc from ?? where md5_unicode = ${md5_unicode};`;

  con.query(sql, 'real_time_activity', function(err, rows) {
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
  res.download('./test.gpx', 'test.gpx', err => {
    if (err) {
      res.send(err);
    } else {
      console.log('success');
    }
  });
});

// Exports
module.exports = router;

