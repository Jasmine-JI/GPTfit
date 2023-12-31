var express = require('express');
var moment = require('moment');
var router = express.Router(),
  routerProtected = express.Router();

const { checkSessionExit, checkEventId, checkShowPortalNum } = require('../models/event_model');

routerProtected.get('/', function (req, res, next) {
  const {
    con,
    query: { event_id, session_id },
  } = req;
  const query1 = event_id ? `where event_id = ${event_id}` : '';
  const sql = `
  SELECT  * from ??
  ${query1}
  ;`;

  con.query(sql, 'race_event_info', function (err, rows) {
    if (err) {
      return console.log(err);
    }
    return res.json(rows);
  });
});

routerProtected.post('/create', (req, res) => {
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
      sessions,
    },
    con,
  } = req;
  try {
    const launch_time_stamp = moment().unix();
    const lanuch_date = moment.unix(launch_time_stamp).format('YYYY-MM-DD H:mm:ss');
    const event_time_name = event_time_start + ' ~ ' + event_time_end;
    const event_id = moment(event_time_start, 'YMDH').format('YMDH');
    const event_start = moment(event_time_start, 'YYYY-MM-DD H:mm:ss').unix();
    const event_end = moment(event_time_end, 'YYYY-MM-DD H:mm:ss').unix();
    let results = [];
    checkEventId(event_id).then((response) => {
      if (response) {
        let showPortalNum = 0;
        if (sessions.length > 0) {
          results = sessions.map((_session) => {
            const {
              session_end_date,
              session_name,
              session_start_date,
              isRealTime,
              isShowPortal,
              isSpecificMap,
              chooseMaps,
            } = _session;
            if (isShowPortal) {
              showPortalNum++;
            }
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
              isShowPortal,
              isSpecificMap,
              chooseMaps,
            ];
          });
        } else {
          results = [
            event_id,
            `${event_name}`,
            launch_time_stamp,
            `${lanuch_date}`,
            `${launch_user_name}`,
            `${description || ''}`,
            `${event_time_name}`,
            event_start,
            event_end,
            event_id,
            `${event_name}`,
            event_start,
            event_end,
          ];
        }

        let sql = '';
        if (sessions.length > 0) {
          sql = `
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
            event_time_end,
            is_real_time,
            is_show_portal,
            is_specific_map,
            specific_map
          )
          values ?;`;
        } else {
          sql = `
          INSERT INTO ?? (
            event_id,
            event_name,
            launch_time_stamp,
            lanuch_date,
            launch_user_name,
            description,
            event_time_name,
            event_time_start,
            event_time_end,
            session_id,
            session_name,
            time_stamp_start,
            time_stamp_end
          )
          values (?);`;
        }
        checkShowPortalNum(showPortalNum).then((data) => {
          const { isTooMuch, currNum } = data;
          if (!isTooMuch) {
            con.query(sql, ['race_event_info', results], (err, rows) => {
              if (err) {
                return res.status(500).send({
                  errorMessage: err.sqlMessage,
                });
              }
              res.send({
                event_id,
                event_name,
                launch_time_stamp,
                lanuch_date,
                launch_user_name,
                description,
              });
            });
          } else {
            res.status(500).json(currNum);
          }
        });
      } else {
        res.status(409).json({ resultMessage: 'duplicate eventId' });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

routerProtected.delete('/:id', function (req, res, next) {
  const {
    con,
    params: { id },
  } = req;
  const sql = `
  delete from ??
  where event_id = ?
  ;`;

  con.query(sql, ['race_event_info', id], function (err, rows) {
    if (err) {
      return res.status(500).send(err);
    }
    return res.json(rows);
  });
});

routerProtected.put('/edit', (req, res, next) => {
  const {
    body: {
      event_id,
      event_name,
      sessions,
      launch_user_name,
      description,
      event_time_start,
      event_time_end,
    },
    con,
  } = req;
  try {
    let values = [];
    const launch_time_stamp = moment().unix();
    const lanuch_date = moment.unix(launch_time_stamp).format('YYYY-MM-DD H:mm:ss');
    const event_time_name = event_time_start + ' ~ ' + event_time_end;
    const event_start = moment(event_time_start, 'YYYY-MM-DD H:mm:ss').unix();
    const event_end = moment(event_time_end, 'YYYY-MM-DD H:mm:ss').unix();
    let showPortalNum = 0;
    if (sessions.length > 0) {
      values = sessions.map((_session) => {
        const {
          session_end_date,
          session_name,
          session_start_date,
          session_id,
          isRealTime,
          isShowPortal,
          chooseMapStr,
          isSpecificMap,
        } = _session;
        if (isShowPortal) {
          showPortalNum++;
        }
        const time_stamp_start = moment(session_start_date, 'YYYY-MM-DD H:mm:ss').unix();
        const time_stamp_end = moment(session_end_date, 'YYYY-MM-DD H:mm:ss').unix();

        return [
          `(
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
            ${isRealTime},
            ${isSpecificMap},
            '${chooseMapStr}'
          )`,
        ];
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
          is_real_time,
          is_specific_map,
          specific_map
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
        is_real_time = values(is_real_time),
        is_specific_map = values(is_specific_map),
        specific_map = values(specific_map)
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
          description = '${description || ''}',
          event_time_name = '${event_time_name}',
          event_time_start = ${event_start},
          event_time_end = ${event_end}
          where event_id = ${event_id}
        ;`;
      }

      const sql2 =
        deleteIds.length > 0
          ? `delete from race_event_info where session_id in (${deleteIds})`
          : '';
      checkShowPortalNum(showPortalNum, event_id).then((data) => {
        const { isTooMuch, currNum } = data;
        if (!isTooMuch) {
          con.query(`${sql}${sql2}`, [values], function (err, rows) {
            if (err) {
              console.log(err.sqlMessage);
              res.status(500).send(err);
            }
            if (rows) {
              res.json({ resultMessage: '更新成功' });
            } else {
              res.status(500).json({ resultMessage: '有遺失喔' });
            }
          });
        } else {
          res.status(400).json(currNum);
        }
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.get('/rankTab', function (req, res, next) {
  const { con } = req;
  const sql = `select is_show_portal, is_real_time,
  time_stamp_start, time_stamp_end, session_name, session_id, event_id, specific_map
  from ??
  where is_show_portal = 1;`;
  con.query(sql, 'race_event_info', function (err, rows) {
    if (err) {
      console.log(err);
    }
    res.json(rows);
  });
});

routerProtected.get('/map', function (req, res, next) {
  const { con } = req;
  const sql = `select map_index, map_name from ?? `;
  con.query(sql, 'race_map_info', function (err, rows) {
    if (err) {
      console.log(err);
    }
    res.json(rows);
  });
});

routerProtected.get('/top3', function (req, res, next) {
  const {
    con,
    query: { sessionId, eventId, gender, mapId },
  } = req;
  const genderQuery = gender ? `and a.gender = ${con.escape(gender)}` : '';
  const sql = `
    select offical_time, login_acc, enroll_name, phone, e_mail, address, rank
      from
      (
        select *, @prev := @curr, @curr := offical_time,
        @rank := if(@prev = @curr, @rank, @rank+1
      ) as rank
      from
      (
        select distinct b.offical_time, a.login_acc,
        c.login_acc as enroll_name, c.phone, c.e_mail, c.address
        from (
        select min(r.offical_time) as offical_time, r.user_id
        from ?? r, ?? as c
        where
        r.map_id = ?
        and
        (
          (r.phone is not NULL and r.phone != '' and c.phone like concat('%', r.phone, '%'))
          or
          (r.e_mail is not NULL and r.e_mail != '' and c.e_mail = r.e_mail)
        )
        and
        c.session_id = ? and c.event_id = ?
        group by r.user_id
      ) as b,
        ?? as a,
        ?? as c
        where a.user_id = b.user_id
        and
        c.session_id = ? and c.event_id = ?
        and
        (
          (a.phone is not NULL and a.phone != '' and c.phone like concat('%', a.phone, '%'))
          or
          (a.e_mail is not NULL and a.e_mail != '' and c.e_mail = a.e_mail)
        )
        ${genderQuery}
        order by offical_time
        )a,
        (
          select @curr := null, @prev :=null, @rank := 0
        )c
        )b where rank < 4
    ;
  `;
  con.query(
    sql,
    [
      'run_rank',
      'user_race_enroll',
      mapId,
      sessionId,
      eventId,
      'run_rank',
      'user_race_enroll',
      sessionId,
      eventId,
    ],
    function (err, rows) {
      if (err) {
        console.log(err);
      }
      res.json(rows);
    }
  );
});
// Exports
module.exports = {
  protected: routerProtected,
  unprotected: router,
};
