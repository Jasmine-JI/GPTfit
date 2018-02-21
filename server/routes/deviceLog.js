var express = require('express');

var router = express.Router();

router.get('/lists', function (req, res, next) {
  const {
    con,
    query: { keyword, userId }
  } = req;
  let keywordQuery = '';

  if (keyword) {
    keywordQuery = keyword.substring(0, 1) === '+' ? `and u.phone = '${keyword}'` : `and u.e_mail = '${keyword}'`;
  }
  let sql = `
    select concat('+',u.country_code, u.phone) as phone_number, u.e_mail,
    DATE_FORMAT(max(s.time), '%Y-%m-%d %h:%i:%s') as time,
    s.user_id, count(s.user_id) as number
    from ?? as s ,
    ?? as u
    where s.user_id= u.user_id
    ${keywordQuery}
    group by s.user_id
    order by time desc
    ;
  `;
  if (userId) {
    sql = `
    select concat('+',u.country_code, u.phone) as phone_number,
    u.e_mail,
    s.message, s.time, s.equipment_sn
    from save_device_log as s,
    user_profile as u
    where s.user_id = u.user_id
    and u.user_id = ${userId}
    order by s.time desc
    ;
  `;
  }
  con.query(sql, ['save_device_log', 'user_profile'], function(err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    res.json(rows);
  });
});

router.get('/search', function(req, res, next) {
  const {
    con,
    query: { keyword }
  } = req;
  const sql1 = `
    select distinct u.e_mail
    from ?? as u,
    ?? as s
    where s.user_id = u.user_id
    and
    u.e_mail != ''
    and
    u.e_mail is not null
    group by u.e_mail;
  `;
  const sql2 = `
    select  concat('+', u.country_code, u.phone) as phone_number
    from ?? as u,
    ?? as s
    where s.user_id = u.user_id
    and
    u.phone != ''
    and
    u.phone is not null
    group by phone_number;
  `;
  const sql = `${sql1}${sql2}`;
  if (keyword.length === 0) {
    return res.send([]);
  }
  con.query(sql, ['user_profile', 'save_device_log', 'user_profile', 'save_device_log'], function(err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({ errorMessage: err.sqlMessage });
    }
    let results = rows[0].map(_row => _row.e_mail);
    rows[1].forEach(_row => {
      return results.push(_row.phone_number);
    });

    results = results.filter(_res => _res.indexOf(keyword) > -1);
    res.json(results);
  });
});

// Exports
module.exports = router;
