var express = require('express');
var formidable = require('formidable');
var _ = require('lodash');
var moment = require('moment');
var XLSX = require('xlsx');
var fs = require('fs');
var router = express.Router();
var checkID = require('../utils');

router.get('/', function (req, res, next) {
  const {
    con,
  } = req;
  const sql = `
  SELECT  * FROM ??;`;
  con.query(sql, 'user_race_enroll', function (err, rows) {
    if (err) {
      console.log(err);
    }
    res.json({ datas: rows });
  });
});

router.post('/enroll', async(req, res) => {
  const {
    body: {
      userName,
      email,
      phone,
      ageRange,
      gender,
      idNumber,
      address,
      event_seesion,
      country_code,
      pay_method,
      status
    },
    con
  } = req;

  try {
    const trimEmail = email.trim();
    const e_mail = trimEmail.toLowerCase();
    const login_acc = userName.trim();
    const race_event = event_seesion.split('-');
    const event_id = race_event[0];
    const session_id = race_event[1];
    const age_range = ageRange.trim();
    const trimIdNumber = idNumber.trim();
    const id_number = trimIdNumber.toUpperCase();
    var now = new Date();
    var now_mill = now.getTime();
    const enroll_time = Math.round(now_mill / 1000);
    const sql = `
    INSERT INTO ?? (
      login_acc,
      e_mail,
      phone,
      age_range,
      gender,
      id_number,
      address,
      event_id,
      session_id,
      enroll_time,
      country_code,
      pay_method,
      status
    )
    value (
      '${login_acc}',
      '${e_mail}',
      '${phone}',
      '${age_range}',
      ${gender},
      '${id_number}',
      '${address}',
      ${event_id},
      ${session_id},
      ${enroll_time},
      '${country_code}',
      '${pay_method}',
      '${status}'
    );`;
    await con.query(sql, 'user_race_enroll', async(err, rows) => {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      res.send({
        userName: login_acc,
        email: e_mail,
        phone,
        ageRange: age_range,
        gender,
        idNumber: id_number,
        address,
        event_id,
        session_id,
        country_code
      });
    });
  } catch (err) {
    res.status(500).send({
      errorMessage: '請檢查報名資料欄位'
    });;
  }
});

router.get('/emailsValidate', async(req, res, next) => {
  const {
    con,
    query: {
      email
    }
  } = req;
  try {
    const sql = `
    SELECT e_mail FROM ??;
    `;

    con.query(sql, 'user_race_enroll', function (err, rows) {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      if (email.length === 0) {
        return res.status(400).send({
          errorMessage: '請填入email'
        });
      }
      const emailRule = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
      const trimEmail = email.trim();
      if (email && trimEmail.search(emailRule) > -1) {
        let results = rows.map(_row => _row.e_mail);
        results = results.filter(_res => _res === trimEmail);
        if (results.length === 0) return res.send('email無重複');
        return res.status(409).send({
          errorMessage: '此email已報名'
        });
      } else {
        return res.status(400).send({
          errorMessage: 'email格式錯誤'
        });
      }
    });
  } catch (err) {
    return res.status(400).send({
      errorMessage: '請填入email'
    });
  }
});

router.get('/phoneValidate', async(req, res, next) => {
  const {
    con,
    query: {
      phone
    }
  } = req;
  try {
    const sql = `
    SELECT phone FROM ??;
    `;

    con.query(sql, 'user_race_enroll', function (err, rows) {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      if (phone.length === 0) {
        return res.status(400).send({
          errorMessage: '請填入電話號碼'
        });
      }
      const trimPhone = phone.trim();

      let results = rows.map(_row => _row.phone);
      results = results.filter(_res => _res === trimPhone);
      if (results.length === 0) return res.send('電話無重複');
      return res.status(409).send({
        errorMessage: '此電話已報名'
      });
    });
  } catch (err) {
    return res.status(400).send({
      errorMessage: '請填入電話號碼'
    });
  }
});

router.get('/idNumberValidate', async(req, res, next) => {
  const {
    con,
    query: {
      idNumber
    }
  } = req;
  try {
    const sql = `
    SELECT id_number FROM ??;
    `;

    con.query(sql, 'user_race_enroll', function (err, rows) {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      if (idNumber.length === 0) {
        return res.status(400).send({
          errorMessage: '請填入身分證字號'
        });
      }
      const trimIdNumber = idNumber.trim();
      const idNum = trimIdNumber.toUpperCase();
      if (idNum && checkID('1', idNum)) {
        let results = rows.map(_row => _row.id_number);
        results = results.filter(_res => _res === idNum);
        if (results.length === 0) return res.send('身分證字號無重複');
        return res.status(409).send({
          errorMessage: '此身分證字號已報名'
        });
      } else {
        return res.status(400).send({
          errorMessage: '身分證字號格式錯誤'
        });
      }
    });
  } catch (err) {
    return res.status(400).send({
      errorMessage: '請填入身分證字號'
    });
  }
});

router.post('/upload', async (req, res, next) => {
  var path;
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).send({ errorMessage: err.sqlMessage });
    }
    path = files.file.path;
    res.path = path;
    next();
  });
}, (req, res, next) => {
    const { con } = req;
    const path = res.path;
    var buf = fs.readFileSync(path);
    var wb = XLSX.read(buf, { type: 'buffer' });
    const sheetNames = wb.SheetNames;
    const worksheet = wb.Sheets[sheetNames[0]];
    const headers = {};
    const datas = [];
    const keys = Object.keys(worksheet);
    keys
      // 过滤以 ! 开头的 key
      .filter(k => k[0] !== '!')
      // 遍历所有单元格
      .forEach(k => {
        // 如 A11 中的 A
        let col = k.substring(0, 1);
        // 如 A11 中的 11
        let row = parseInt(k.substring(1));
        // 当前单元格的值
        let value = worksheet[k].v;
        // 保存字段名
        if (row === 1) {
          headers[col] = value;
          return;
        }
        // 解析成 JSON
        if (!datas[row]) {
          datas[row] = {};
        }
        datas[row][headers[col]] = value;
      });
    const filterArr = datas.filter(_data => _data['狀態'] === '已付款');
    const parseResults = filterArr.map(_data => {
      var map = { 票號: 'ticket_id', 持票人姓名: 'login_acc', 持票人Email: 'e_mail', 持票人手機: 'phone', 票種分組名稱: 'ticket_group', 票券名稱: 'session_name', 付款方式: 'pay_method', 狀態: 'status', '有效時間(GMT+8)': 'event_id', '報名時間(GMT+8)': 'enroll_time', 年齡: 'age_range', 性別: 'gender', 身分證字號: 'id_number', 地址: 'address' };
      const resultData = {};
      _.each(_data, function(value, key) {
        resultData[map[key]] = value;
        if (map[key] === 'event_id' && resultData[map[key]] === '2018-01-10 14:00 ~ 2018-02-09 16:00') {
          resultData[map[key]] = 1;
        }
        if (map[key] === 'e_mail') {
          resultData[map[key]].trim();
        }
        if (map[key] === 'phone') {
          let phone = resultData[map[key]];
          resultData.country_code = phone.slice(0, 3);
          if (resultData.country_code === '886') {
            resultData[map[key]] = '0' + phone.slice(3, phone.length);
          }
          // to fix 等其他國碼在做判斷
        }
        if (map[key] === 'gender') {
          let sex = resultData[map[key]];
          if (sex === '男性') {
            resultData[map[key]] = 0;
          } else if (sex === '女性') {
            resultData[map[key]] = 1;
          } else {
            resultData[map[key]] = 2;
          }
        }
        if (map[key] === 'enroll_time') {
          resultData[map[key]] = moment(resultData[map[key]]).unix();
        }
      });
      return resultData;
    });
    res.parseResults = parseResults;
    next();
  }
, (req, res) => {
    const { con } = req;
    const { parseResults } = res;
    try {
      const {
        login_acc,
        e_mail,
        phone,
        age_range,
        gender,
        id_number,
        address,
        event_id,
        session_name,
        enroll_time,
        country_code,
        pay_method,
        status,
        ticket_id,
        ticket_group
      } = parseResults[0];
      const sql = `
      INSERT INTO ?? (
        login_acc,
        e_mail,
        phone,
        age_range,
        gender,
        id_number,
        address,
        event_id,
        session_name,
        enroll_time,
        country_code,
        pay_method,
        status,
        ticket_id,
        ticket_group
      )
      value (
        '${login_acc}',
        '${e_mail}',
        '${phone}',
        '${age_range}',
        ${gender},
        '${id_number}',
        '${address}',
        ${event_id},
        '${session_name}',
        ${enroll_time},
        '${country_code}',
        '${pay_method}',
        '${status}',
        '${ticket_id}',
        '${ticket_group}'
      );`;
      con.query(sql, 'user_race_enroll', async(err, rows) => {
        if (err) {
          return res.status(500).send({
            errorMessage: err.sqlMessage
          });
        }
        res.send('上傳成功!!');
      });
    } catch (err) {
      return res.status(500).send({ errorMessage: '請檢查報名資料欄位' });
    }
});

// Exports
module.exports = router;
