var express = require('express');
var moment = require('moment');
var router = express.Router();

router.get('/', function (req, res, next) {
  const {
    con,
    query: { code }
  } = req;
  const sql = `
  SELECT  * from ??
  ;`;

  con.query(sql, 'race_event_info', function (err, rows) {
    if (err) {
      return console.log(err);
    }
    return res.send({datas: rows });
  });
});

router.post('/create', async(req, res) => {
  const {
    body: {
      event,
      event_name,
      session,
      session_name,
      start_date,
      end_date,
      launch_user_name,
      description
    },
    con
  } = req;

  try {
    const time_stamp_start = moment(start_date).unix();
    const time_stamp_end = moment(end_date).unix();

    const launch_time_stamp = moment().unix();
    const lanuch_date = moment.unix(launch_time_stamp).format('YYYY-MM-DD H:mm:ss.000000');
    const sql = `
    INSERT INTO ?? (
      event,
      event_name,
      session,
      session_name,
      time_stamp_start,
      start_date,
      time_stamp_end,
      end_date,
      launch_time_stamp,
      lanuch_date,
      launch_user_name,
      description
    )
    value (
      ${event},
      '${event_name}',
      ${session},
      '${session_name}',
      ${time_stamp_start},
      '${start_date}',
      ${time_stamp_end},
      '${end_date}',
      ${launch_time_stamp},
      '${lanuch_date}',
      '${launch_user_name}',
      '${description}'
    );`;
    await con.query(sql, 'race_event_info', async(err, rows) => {
      if (err) {
        console.log('!!!!!', err);
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      res.send({
        event,
        event_name,
        session,
        session_name,
        time_stamp_start,
        start_date,
        time_stamp_end,
        end_date,
        launch_time_stamp,
        lanuch_date,
        launch_user_name,
        description
      });
    });
  } catch (err) {
    console.log('~~~~~', err);
    res.status(500).send({
      errorMessage: '請檢查活動賽事資料欄位'
    });;
  }
});

// Exports
module.exports = router;
