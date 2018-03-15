var express = require('express');

var router = express.Router();

router.post('/createRace', function(req, res, next) {
  const {
    con,
    body: { raceId }
  } = req;
  const sql = `
    CREATE TABLE ?? (
      heart_rate FLOAT(8) ,
      utc VARCHAR(64),
      pace VARCHAR(64),
      distance FLOAT(8)
    );
  `;
  con.query(sql, `tmp_race_data_${raceId}`, function(err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({ errorMessage: err.sqlMessage });
    }
    res.send('create success');
  });
});

router.post('/example', function(req, res, next) {
  const { con, body: { codes } } = req;
  let codeSql = codes.map(_code => {
    return `
    select heart_rate, utc, pace, distance from real_time_activity
    where md5_unicode = '${_code}';
    `;
  })
  codeSql = codeSql.join('');
  con.query(codeSql, 'real_time_activity', function(err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({ errorMessage: err.sqlMessage });
    }
    res.json(rows);
  });
});

router.get('/fileName', function(req, res, next) {
  const { con, query: { userId } } = req;
  // let idSql = ids.map(_id => {
  //   return `
  //     select md5_unicode, file_name   from sport where user_id = ${_id};
  //   `;
  // });
  // idSql = idSql.join('');
  const sql = `select md5_unicode, file_name   from sport where user_id = ${userId};`;
  con.query(sql, 'sport', function(err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({ errorMessage: err.sqlMessage });
    }
    res.json(rows);
  });
});


router.post('/fakeData', function(req, res, next) {
  const {
    con,
    body: {
      raceId,
      heartRate,
      time,
      pace,
      distance
    }
  } = req;
  const sql = `
    insert into ?? (heart_rate, utc, pace, distance )
    values(${heartRate}, '${time}', '${pace}', ${distance})
  `;
  con.query(sql, `tmp_race_data_${raceId}`, function(err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({ errorMessage: err.sqlMessage });
    }
    res.json({ heartRate });
  });
});
// Exports
module.exports = router;
