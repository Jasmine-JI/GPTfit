var express = require('express');

var router = express.Router();

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

// Exports
module.exports = router;
