var express = require('express');
var formidable = require('formidable');
var _ = require('lodash');
var moment = require('moment');
var XLSX = require('xlsx');
var fs = require('fs');
var router = express.Router();
var checkID = require('../utils').checkID;

router.get('/', function (req, res, next) {
  const {
    con,
    query: {
      event_id,
      session_id
    }
  } = req;
  const sessionQuery = session_id ? `and session_id = ${session_id}` : '';

  const query1 = event_id ? `where event_id = ${event_id} ${sessionQuery}` : '';
  const sql = `
  SELECT  distinct * FROM ?? ${query1};`;
  con.query(sql, 'user_race_enroll', function (err, rows) {
    if (err) {
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    res.status(200).json(rows);
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
      event_id,
      session_id,
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
    const age_range = ageRange.trim();
    const trimIdNumber = idNumber.trim();
    const id_number = trimIdNumber.toUpperCase();
    var now = new Date();
    var now_mill = now.getTime();
    const enroll_time = Math.round(now_mill / 1000);
    const sqlParams = ['user_race_enroll', login_acc, e_mail, phone, age_range,
      gender, id_number, address, event_id, session_id, enroll_time, country_code,
      pay_method, status
    ];
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
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    );`;
    await con.query(sql, sqlParams, async(err, rows) => {
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
      email,
      event_id
    }
  } = req;
  try {
    const sql = `
    SELECT e_mail FROM ?? where event_id = ?;
    `;

    con.query(sql, ['user_race_enroll', event_id], function (err, rows) {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      if (email.length === 0) {
        return res.status(400).send('請填入email');
      }
      const emailRule = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
      const trimEmail = decodeURIComponent(email).trim();
      if (email && trimEmail.search(emailRule) > -1) {
        let results = rows.map(_row => _row.e_mail);
        results = results.filter(_res => _res === trimEmail);
        if (results.length === 0) return res.json('email無重複');
        return res.status(409).send('此email已報名');
      } else {
        return res.status(400).send('email格式錯誤');
      }
    });
  } catch (err) {
    return res.status(400).send('請填入email');
  }
});

router.get('/phoneValidate', async(req, res, next) => {
  const {
    con,
    query: {
      phone,
      event_id
    }
  } = req;
  try {
    const sql = `
    SELECT phone FROM ?? where event_id = ?;
    `;

    con.query(sql, ['user_race_enroll', event_id], function(err, rows) {
      if (err) {
        return res.status(500).send({ errorMessage: err.sqlMessage });
      }
      if (phone.length === 0) {
        return res.status(400).send('請填入電話號碼');
      }
      const trimPhone = phone.trim();

      let results = rows.map(_row => _row.phone);
      results = results.filter(_res => _res === trimPhone);
      if (results.length === 0) return res.json('電話無重複');
      return res.status(409).send('此電話已報名');
    });
  } catch (err) {
    return res.status(400).send('請填入電話號碼');
  }
});

router.get('/idNumberValidate', async(req, res, next) => {
  const {
    con,
    query: {
      idNumber,
      event_id
    }
  } = req;
  try {
    const sql = `
    SELECT id_number FROM ?? where event_id = ?;
    `;

    con.query(sql, ['user_race_enroll', event_id], function (err, rows) {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      if (idNumber.length === 0) {
        return res.status(400).send('請填入身分證字號');
      }
      const trimIdNumber = idNumber.trim();
      const idNum = trimIdNumber.toUpperCase();
      if (idNum && checkID('1', idNum)) {
        let results = rows.map(_row => _row.id_number);
        results = results.filter(_res => _res === idNum);
        if (results.length === 0) return res.json('身分證字號無重複');
        return res.status(409).send('此身分證字號已報名');
      } else {
        return res.status(400).send('身分證字號格式錯誤');
      }
    });
  } catch (err) {
    return res.status(400).send('請填入身分證字號');
  }
});

router.post('/upload', async (req, res, next) => {
  const sql = `SELECT  * from ??`;
  const { con } = req;
  con.query(sql, 'race_event_info', function(err, rows) {
    if (err) {
      return console.log(err);
    }
    res.events = rows;
    var path;
    var form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(500).send({ errorMessage: err.sqlMessage });
      }
      const { eventId, sessionId } = fields;
      path = files.file.path;
      res.path = path;
      if (eventId && sessionId) {
        res.eventId = eventId;
        res.sessionId = sessionId;
      } else {
        return res.status(500).send({ errorMessage: '請檢查報名資料欄位' });
      }

        next();

    });
  });


}, (req, res, next) => {
    const { con } = req;
    const {
      path,
      events,
      eventId,
      sessionId
    } = res;

    var buf = fs.readFileSync(path);
    var wb = XLSX.read(buf, { type: 'buffer' });
    const sheetNames = wb.SheetNames;
    const worksheet = wb.Sheets[sheetNames[0]];
    const headers = {};
    let datas = [];
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
    let count = 0;
    let parseResults = [];
    datas = datas.filter(_data => _data !== undefined);
    parseResults = datas.map(_data => {
      count++;
      var map = {
        電子郵件地址: 'e_mail',
        姓名: 'login_acc',
        性別: 'gender',
        年齡: 'age_range',
        電話: 'phone',
        住址: 'address'
      };
      const resultData = {
        eventId,
        sessionId,
        enroll_time: moment().unix(),
        country_code: '886'
      };
      _.each(_data, function(value, key) {
        resultData[map[key]] = value;
        if (map[key] !== undefined) {
          if (map[key] === 'e_mail') {
            resultData[map[key]].trim();
          }
          if (map[key] === 'gender') {
            let sex = resultData[map[key]];
            if (sex === '男') {
              resultData[map[key]] = 0;
            } else if (sex === '女') {
              resultData[map[key]] = 1;
            } else {
              resultData[map[key]] = 2;
            }
          }
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
      const results = parseResults.map((_result) => {
        return Object.values(_result);
      });
      const sql = `
      INSERT INTO ?? (
        event_id,
        session_id,
        enroll_time,
        country_code,
        e_mail,
        login_acc,
        gender,
        age_range,
        phone,
        address
      )
      values ?;`;
      con.query(sql, ['user_race_enroll', results], async(err, rows) => {
        if (err) {
          return res.status(500).send({
            errorMessage: err.sqlMessage
          });
        }
        res.json('上傳成功!!');
      });
    } catch (err) {
      return res.status(500).send({ errorMessage: '請檢查報名資料欄位' });
    }
});

// Exports
module.exports = router;
