var express = require('express');
var moment = require('moment');
var router = express.Router();


router.get('/', function (req, res, next) {
  const {
    con,
    query: {
      event_id,
      session_id
    }
  } = req;
  const sessionQuery = session_id ? `and session_id = ${session_id}` : '';
  const eventQuery = event_id ? `where event_id = ${event_id}  ${sessionQuery}` : '';
  const sql = `
  SELECT  * from ??
  ${eventQuery}
  ;`;

  con.query(sql, 'race_event_info', function (err, rows) {
    if (err) {
      return console.log(err);
    }
    return res.json(rows);
  });
});

router.post('/create', (req, res) => {
  const {
    body: {
      event_name,
      session_name,
      start_date,
      end_date,
      launch_user_name,
      description,
      event_time_start,
      event_time_end
    },
    con
  } = req;
  try {
    const time_stamp_start = moment(start_date).unix();
    const time_stamp_end = moment(end_date).unix();
    const session_id = moment(start_date).format('YMDH');
    const launch_time_stamp = moment().unix();
    const lanuch_date = moment.unix(launch_time_stamp).format('YYYY-MM-DD H:mm:ss.000000');
    const event_time_name = event_time_start + ' ~ ' + event_time_end;
    const event_id = moment(event_time_start).format('YMDH');
    const event_start = moment(event_time_start).unix();
    const event_end = moment(event_time_end).unix();

    const sql = `
    INSERT INTO ?? (
      event_id,
      event_name,
      session_id,
      session_name,
      time_stamp_start,
      start_date,
      time_stamp_end,
      end_date,
      launch_time_stamp,
      lanuch_date,
      launch_user_name,
      description,
      event_time_name,
      event_time_start,
      event_time_end
    )
    value (
      ${event_id},
      '${event_name}',
      ${session_id},
      '${session_name}',
      ${time_stamp_start},
      '${start_date}',
      ${time_stamp_end},
      '${end_date}',
      ${launch_time_stamp},
      '${lanuch_date}',
      '${launch_user_name}',
      '${description}',
      '${event_time_name}',
      ${event_start},
      ${event_end}
    );`;
    console.log('sql: ', sql);
    con.query(sql, 'race_event_info', (err, rows) => {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      res.send({
        event_id,
        event_name,
        session_id,
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
    console.log(err);
    res.status(500).send(err);;
  }
});

// Exports
module.exports = router;
