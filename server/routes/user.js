var express = require('express');
var searchNickname = require('../models/user_id').searchNickname;
var getUserList = require('../models/user_id').getUserList;

var router = express.Router();
var checkAccessRight = require('../models/auth.model').checkAccessRight;

router.get('/userProfile', function (req, res, next) {
  const {
    con,
    query: { userId }
  } = req;
  const sql = `
    select distinct u.login_acc, u.icon_large as userIcon from
    ?? u where user_id = ?;
  `;
  con.query(sql, ['user_profile', userId], function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    let userName = '';
    let userIcon = '';
    if (rows.length > 0) {
      userName = rows[0].login_acc;
      userIcon = rows[0].userIcon;
    }

    res.json({
      userName,
      userIcon
    });
  });
});

router.get('/userAvartar', function (req, res, next) {
  const {
    con,
    query: {
      userId
    }
  } = req;
  const token = req.headers['authorization'];
  checkAccessRight(token, 29).then(_res => {
    if (_res) {
      const sql = `
        select login_acc, icon_small, icon_middle, icon_large, e_mail, phone, country_code, active_status, time_stamp, timestamp_reset_passwd, gender, birthday
        from ??
        where user_id = ?;
      `;
      con.query(sql, ['user_profile', userId], function (err, rows) {
        if (err) {
          console.log(err);
          return res.status(500).send({
            errorMessage: err.sqlMessage
          });
        }
        let userName = '';
        if (rows.length > 0) {
          userName = rows[0].login_acc;
          smallIcon = rows[0].icon_small;
          middleIcon = rows[0].icon_middle;
          largeIcon = rows[0].icon_large;
          email = rows[0].e_mail || '';
          countryCode = rows[0].country_code || '';
          phone = rows[0].phone || '';
          enableStatus = rows[0].active_status;
          lastLogin = rows[0].time_stamp;
          lastResetPwd = rows[0].timestamp_reset_passwd;
          gender = rows[0].gender;
          birthday = rows[0].birthday;
        }

        res.json({
          resultCode: 200,
          userName,
          smallIcon,
          middleIcon,
          largeIcon,
          email,
          countryCode,
          phone,
          enableStatus,
          lastLogin,
          lastResetPwd,
          gender,
          birthday
        });
      });
    } else {
      res.json({
        resultCode: 403,
        rtnMsg: '你沒權限~'
      });
    }

  });
});

router.post('/getLogonData_v2', function (req, res, next) {
  const {
    con,
    body: {
      iconType,
      token
    }
  } = req;
  let iconQuery = '';
  if (iconType === '0') {
    iconQuery = ', icon_large as nameIcon';
  } else if (iconType === '1') {
    iconQuery = ', icon_middle as nameIcon';
  } else {
    iconQuery = ', icon_small as nameIcon';
  }
  const sql = `
    select u.login_acc as name,
    u.user_id as nameId
    ${iconQuery}
    from ?? u, ?? s where access_token = ?;
  `;
  const sql1 = `
    select s1.sport_id, s1.max_speed, s1.max_pace
    from sport as s1 join(select max(max_speed) as max_speed
    from sport where user_id = 46) as s2
    on s1.max_speed = s2.max_speed
    where s1.user_id = 46;
  `;
  con.query(sql, ['user_profile', 'sport', token], function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    const data = rows[0];
    res.json({
      name: data['name'],
      nameId: data['nameId'],
      rtnMsg: "Get logon data success.",
      token,

    });
  });
});

// 使用關鍵字尋找相關暱稱(auto complete list)-kidin-1090908
router.post('/search_nickname', function (req, res, next) {
  const {
    con,
    body
  } = req;

  const result = searchNickname(body.keyword).then(result => {
    if (result) {
      return res.json({
        resultCode: 200,
        resultMessage: "Get result success.",
        nickname: result
      });

    } else {
      return res.json({
        resultCode: 400,
        resultMessage: "Not found.",
      })

    }

  });

});

// userId[]查找暱稱-kidin-1090923
router.post('/getUserList', function (req, res, next) {
  const {
    con,
    body
  } = req;

  const result = getUserList(body.userIdList).then(resp => {
    if (resp) {

      const resList = [];
      body.userIdList.forEach(_list => {

        resp.forEach(__resp => {

          if (_list === +__resp.userId) {
            resList.push(__resp);
          }

        });

      });

      return res.json({
        apiCode: 'N9001', // 暫定
        resultCode: 200,
        resultMessage: "Get result success.",
        nickname: resList
      });

    } else {
      return res.json({
        apiCode: 'N9001', // 暫定
        resultCode: 400,
        resultMessage: "Get result failed.",
      })

    }

  });

});

// Exports
module.exports = router;
