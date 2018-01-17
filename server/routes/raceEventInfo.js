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
  SELECT  distinct event_id,
  event_name, launch_time_stamp,
  lanuch_date, launch_user_name,
  description,
  event_time_name,
  event_time_start,
  event_time_end
  from race_event_info
  ${eventQuery}
  ;`;

  const sql3 = `
  select session_id,
  session_name,
  time_stamp_start,
  start_date,
  time_stamp_end, end_date
  from race_event_info where event_id = ${event_id};`
  const sqlQuery = event_id ? sql + sql3 : sql;

  con.query(sqlQuery, function (err, rows) {
    if (err) {
      return console.log(err);
    }
    let datas = rows;
    if (event_id) {
      datas = rows[0][0];
      const sessions = rows[1];
      if (sessions[0].session_id === null) {
        datas.sessions = [];
      } else {
        datas.sessions = rows[1];
      }
    }
    res.json(datas);
  });
});

router.post('/create', (req, res) => {
  const {
    body: {
      event_name,
      sessions,
      launch_user_name,
      description,
      event_time_start,
      event_time_end
    },
    con
  } = req;
  try {
    const sessionQuery = sessions.length > 0 ? `, time_stamp_start, start_date, time_stamp_end, end_date` : '';
    const launch_time_stamp = moment().unix();
    const lanuch_date = moment.unix(launch_time_stamp).format('YYYY-MM-DD H:mm:ss.000000');
    const event_time_name = event_time_start + ' ~ ' + event_time_end;
    const event_id = moment(event_time_start).format('YMDH');
    const event_start = moment(event_time_start).unix();
    const event_end = moment(event_time_end).unix();
    let values = [`(
      ${event_id},
      '${event_name}',
      null,
      'null',
      ${launch_time_stamp},
      '${lanuch_date}',
      '${launch_user_name}',
      '${description}',
      '${event_time_name}',
      ${event_start},
      ${event_end}
    )`];
    if (sessions.length > 0) {
      values = sessions.map(_session => {
        return [`(
          ${event_id},
          '${event_name}',
          ${moment(_session.session_start_date).format('YMDH')},
          '${_session.session_name || null}',
          ${launch_time_stamp},
          '${lanuch_date}',
          '${launch_user_name}',
          '${description}',
          '${event_time_name}',
          ${event_start},
          ${event_end},
          ${moment(_session.session_start_date).unix()},
          '${_session.session_start_date}',
          ${moment(_session.session_end_date).unix()},
          '${_session.session_end_date}'
        )`];
      });
    }
    const sql = `
    INSERT INTO ?? (
      event_id,
      event_name,
      session_id,
      session_name,
      launch_time_stamp,
      lanuch_date,
      launch_user_name,
      description,
      event_time_name,
      event_time_start,
      event_time_end
      ${sessionQuery}
    )
    values ${values};`;

    con.query(sql, 'race_event_info', (err, rows) => {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      res.json(rows);
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);;
  }
});

router.delete('/:id', function(req, res, next) {
  const { con, params: { id } } = req;
  const sql = `
  delete from ??
  where event_id = ?
  ;`;

  con.query(sql, ['race_event_info', id], function(err, rows) {
    if (err) {
      return console.log(err);
    }
    return res.json(rows);
  });
});

router.put('/edit', (req, res) => {
  const {
    body: {
      event_id,
      event_name,
      sessions,
      launch_user_name,
      description,
      event_time_start,
      event_time_end
    },
    con
  } = req;
  try {
    const sessionQuery =
      sessions.length > 0
        ? `, time_stamp_start = ?, start_date = ?, time_stamp_end = ?, end_date = ?`
        : '';
    const launch_time_stamp = moment().unix();
    const lanuch_date = moment
      .unix(launch_time_stamp)
      .format('YYYY-MM-DD H:mm:ss.000000');
    const event_time_name = event_time_start + ' ~ ' + event_time_end;
    // const event_id = moment(event_time_start).format('YMDH');
    const event_start = moment(event_time_start).unix();
    const event_end = moment(event_time_end).unix();
    let values = `
      event_id = ${event_id},
      event_name = '${event_name}',
      session_id = null,
      launch_time_stamp = ${launch_time_stamp},
      lanuch_date = '${lanuch_date}',
      launch_user_name = '${launch_user_name}',
      description = '${description}',
      event_time_name = '${event_time_name}',
      event_time_start = ${event_start},
      event_time_end = ${event_end}
    `;
    if (sessions.length > 0) {
      values = sessions.map(_session => {
        return `
          event_id = ${event_id},
          event_name = ${event_name},
          session_id = ${moment(_session.session_start_date).format('YMDH')},
          session_name = '${_session.session_name || null}',
          launch_time_stamp = ${launch_time_stamp},
          lanuch_date = '${lanuch_date}',
          launch_user_name = '${launch_user_name}',
          description = '${description}',
          event_time_name = '${event_time_name}',
          event_time_start = ${event_start},
          event_time_end = ${event_end},
          time_stamp_start = ${Number(moment(_session.session_start_date).unix())},
          start_date = '${_session.session_start_date}',
          time_stamp_end = ${Number(moment(_session.session_end_date).unix())},
          end_date = '${_session.session_end_date}'
        `;
      });
    }
    const sql = `
    UPDATE ??
    SET
      ${values}
      where event_id = ${event_id};`;
    con.query(sql, 'race_event_info', (err, rows) => {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      res.json(rows);
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
// Exports
module.exports = router;
