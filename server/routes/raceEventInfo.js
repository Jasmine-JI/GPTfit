var express = require('express');
var moment = require('moment');
var router = express.Router();
var checkSessionExit = require('../models/event_model');

router.get('/', function(req, res, next) {
  const { con, query: { event_id, session_id } } = req;
  const query1 =
    event_id
      ? `where event_id = ${event_id}`
      : '';
  const sql = `
  SELECT  * from ??
  ${query1}
  ;`;

  con.query(sql, 'race_event_info', function(err, rows) {
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
      event_time_end,
      sessions
    },
    con
  } = req;
  try {

    const launch_time_stamp = moment().unix();
    const lanuch_date = moment
      .unix(launch_time_stamp)
      .format('YYYY-MM-DD H:mm:ss');
    const event_time_name = event_time_start + ' ~ ' + event_time_end;
    const event_id = moment(event_time_start, 'YMDH').format('YMDH');
    const event_start = moment(event_time_start, 'YYYY-MM-DD H:mm:ss').unix();
    const event_end = moment(event_time_end, 'YYYY-MM-DD H:mm:ss').unix();
    let results = [];
    if (sessions.length > 0) {
      results = sessions.map(_session => {
        const {
          session_end_date,
          session_name,
          session_start_date,
          isRealTime,
          isShowPortal
        } = _session;
        const time_stamp_start = moment(session_start_date).unix();
        const time_stamp_end = moment(session_end_date).unix();
        const session_id = moment(session_start_date, 'YMDH').format('YMDH');
        return [
          event_id,
          `${event_name}`,
          session_id,
          `${session_name}`,
          time_stamp_start,
          `${session_start_date}`,
          time_stamp_end,
          `${session_end_date}`,
          launch_time_stamp,
          `${lanuch_date}`,
          `${launch_user_name}`,
          `${description}`,
          `${event_time_name}`,
          event_start,
          event_end,
          isRealTime,
          isShowPortal
        ];
      });
    } else {
      results = [
        event_id,
        `${event_name}`,
        launch_time_stamp,
        `${lanuch_date}`,
        `${launch_user_name}`,
        `${description || null}`,
        `${event_time_name}`,
        event_start,
        event_end
      ];
    }

    let sql = '';
    if (sessions.length > 0) {
      sql = `
      INSERT INTO race_event_info (
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
        event_time_end,
        is_real_time,
        is_show_portal
      )
      values ?;`;
    } else {
      sql = `
      INSERT INTO race_event_info (
        event_id,
        event_name,
        launch_time_stamp,
        lanuch_date,
        launch_user_name,
        description,
        event_time_name,
        event_time_start,
        event_time_end
      )
      values (${event_id}, '${event_name}', ${launch_time_stamp}, '${lanuch_date}', '${launch_user_name}', '${description}', '${event_time_name}', ${event_start}, ${event_end});`;
    }

    con.query(sql, [results], (err, rows) => {
      if (err) {
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      res.send({
        event_id,
        event_name,
        launch_time_stamp,
        lanuch_date,
        launch_user_name,
        description
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
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
      return res.status(500).send(err);
    }
    return res.json(rows);
  });
});

router.put('/edit', (req, res, next) => {
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
      let values = [];
      const launch_time_stamp = moment().unix();
      const lanuch_date = moment
        .unix(launch_time_stamp)
        .format('YYYY-MM-DD H:mm:ss');
      const event_time_name = event_time_start + ' ~ ' + event_time_end;
      const event_start = moment(event_time_start, 'YYYY-MM-DD H:mm:ss').unix();
      const event_end = moment(event_time_end, 'YYYY-MM-DD H:mm:ss').unix();
      if (sessions.length > 0) {
        values = sessions.map(_session => {
          const {
            session_end_date,
            session_name,
            session_start_date,
            session_id,
            isRealTime,
            isShowPortal
          } = _session;
          const time_stamp_start = moment(session_start_date, 'YYYY-MM-DD H:mm:ss').unix();
          const time_stamp_end = moment(session_end_date, 'YYYY-MM-DD H:mm:ss').unix();

          return [`(
            ${event_id},
            '${event_name}',
            ${session_id},
            '${session_name}',
            ${time_stamp_start},
            '${session_start_date}',
            ${time_stamp_end},
            '${session_end_date}',
            ${launch_time_stamp},
            '${lanuch_date}',
            '${launch_user_name}',
            '${description}',
            '${event_time_name}',
            ${event_start},
            ${event_end},
            ${isShowPortal},
            ${isRealTime}
          )`];
        });
      }
    let sql = '';
    checkSessionExit(event_id, sessions).then((deleteIds) => {
      if (sessions.length > 0) {
        sql = `
        INSERT INTO race_event_info (
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
          event_time_end,
          is_show_portal,
          is_real_time
        )
        values ${values}
        on duplicate key
        update
        event_id = values(event_id),
        event_name = values(event_name),
        session_name = values(session_name),
        time_stamp_start = values(time_stamp_start),
        start_date = values(start_date),
        time_stamp_end = values(time_stamp_end),
        end_date = values(end_date),
        launch_time_stamp = values(launch_time_stamp),
        lanuch_date = values(lanuch_date),
        launch_user_name = values(launch_user_name),
        description = values(description),
        event_time_name = values(event_time_name),
        event_time_start = values(event_time_start),
        event_time_end = values(event_time_end),
        is_show_portal = values(is_show_portal),
        is_real_time = values(is_real_time)
        ;`;
      } else {
        sql = `
          update race_event_info
          set
          event_id = ${event_id},
          event_name = '${event_name}',
          launch_time_stamp = ${launch_time_stamp},
          lanuch_date = '${lanuch_date}',
          launch_user_name = '${launch_user_name}',
          description = '${description}',
          event_time_name = '${event_time_name}',
          event_time_start = ${event_start},
          event_time_end = ${event_end}
        ;`;
      }

      const sql2 = deleteIds.length > 0 ? `delete from race_event_info where session_id in (${deleteIds})` : '';

      con.query(`${sql}${sql2}`, [values], function(err, rows) {
        if (err) {
          console.log(err.sqlMessage);
          res.status(500).send(err);
        }
        if (rows) {
          res.send('更新成功');
        } else {
          res.status(500).send('有遺失喔');
        }
      });
    });

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/rankTab', function(req, res, next) {
  const { con } = req;
  const sql = `select is_show_portal, is_real_time,
  time_stamp_start, time_stamp_end, session_name, session_id, event_id
  from ??
  where is_show_portal = 1;`;
  con.query(sql, 'race_event_info', function(err, rows) {
    if (err) {
      console.log(err);
    }
    res.json(rows);
  });
});

// Exports
module.exports = router;
