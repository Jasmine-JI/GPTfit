var express = require('express');

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
      country_code
    },
    con
  } = req;


  try {
    const trimEmail = email.trim();
    const e_mail = trimEmail.toLowerCase();
    const login_acc = userName.trim();
    const race_event = event_seesion.split('-');
    const event = race_event[0];
    const session = race_event[1];
    const age_range = ageRange.trim();
    const trimIdNumber = idNumber.trim();
    const id_number = trimIdNumber.toUpperCase();
    var now = new Date();
    var now_mill = now.getTime();
    const time_stamp = Math.round(now_mill / 1000);
    const sql = `
    INSERT INTO ?? (
      login_acc,
      e_mail,
      phone,
      age_range,
      gender,
      id_number,
      address,
      event,
      session,
      time_stamp,
      country_code
    )
    value (
      '${login_acc}',
      '${e_mail}',
      '${phone}',
      '${age_range}',
      ${gender},
      '${id_number}',
      '${address}',
      ${event},
      ${session},
      ${time_stamp},
      '${country_code}'
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
        event,
        session,
        country_code
      });
    });
  } catch (err) {
    console.log('~~~~~', err);
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
        console.log('!!!!', err);
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
      event_seesion
    },
    con
  } = req;

  try {
    const trimEmail = email.trim();
    const e_mail = trimEmail.toLowerCase();
    const login_acc = userName.trim();
    const race_event = event_seesion.split('-');
    const event = race_event[0];
    const session = race_event[1];
    const age_range = ageRange.trim();
    const trimIdNumber = idNumber.trim();
    const id_number = trimIdNumber.toUpperCase();
    const sql = `
    INSERT INTO ?? (
      login_acc,
      e_mail,
      phone,
      age_range,
      gender,
      id_number,
      address,
      event,
      session
    )
    value (
      '${login_acc}',
      '${e_mail}',
      '${phone}',
      '${age_range}',
      ${gender},
      '${id_number}',
      '${address}',
      ${event},
      ${session}
    );`;
    await con.query(sql, 'user_race_enroll', async(err, rows) => {
      if (err) {
        console.log('!!!!!', err);
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
        event,
        session
      });
    });
  } catch (err) {
    console.log('~~~~~', err);
    res.status(500).send({
      errorMessage: '請檢查報名資料欄位'
    });;
  }
});
// Exports
module.exports = router;
