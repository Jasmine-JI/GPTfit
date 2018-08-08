var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var exec = require('child_process').exec;

// for demo 類圖床
router.post('/upload', (req, res, next) => {
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    const path = files.file.path; // 第二個file是formData的key名
    const fileName = files.file.name;

    exec(`mv ${path} /var/cloud/${fileName}`, function (error, stdout, stderr) {
      if (error) {
        console.error('error: ' + error);
        return;
      }
      exec(`ls /var/cloud `, function (error, stdout, stderr) {
        res.json({
          resultCode: 200,
          rtnMsg: 'upload successfully!!!',
          datas: stdout.split('\n').filter(_file => _file.length > 0)
        })
      });
    });
  });
});
// Exports
module.exports = router;
