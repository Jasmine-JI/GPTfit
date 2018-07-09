var express = require('express');
var moment = require('moment');
var router = express.Router(),
    routerProtected = express.Router();

var currentDate = function() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }

  if (mm < 10) {
    mm = '0' + mm;
  }
  today = yyyy + '-' + mm + '-' + dd;
  return today;
};

routerProtected.get(
  '/manualUpdate',
  function(req, res, next) {
    const { con } = req;
    const sql = 'TRUNCATE TABLE ??';

    con.query(sql, 'run_rank', function(err, rows) {
      if (err) {
        throw err;
      }
      next();
    });
  },
  (req, res, next) => {
    const { con } = req;
    var now = new Date();
    var now_mill = now.getTime();
    const update_time = Math.round(now_mill / 1000);
    const sql2 = `
  insert into ??
select
  b.offical_time,
  b.user_id,
  b.month,
  b.date,
  b.map_id,
  b.file_name,
  p.gender,
  p.login_acc,
  p.e_mail,
  m.map_name,
  m.race_category,
  m.race_total_distance,
  p.phone,
  p.country_code,
  ${update_time}
from (
  select distinct r2.user_id,
    r2.map_id,
    FROM_UNIXTIME(r2.time_stamp, "%Y-%m-%d") as date,
    FROM_UNIXTIME(r2.time_stamp, "%m") as month,
    r2.activity_duration as offical_time,
    r2.activity_distance,
    r2.time_stamp,
    r2.file_name
    from
    (
      SELECT r.user_id,
      r.map_id,
      FROM_UNIXTIME(r.time_stamp, "%Y-%m-%d") as date,
      MIN(r.activity_duration) AS min_duration
      FROM race_data as r,
      race_map_info as m1
      WHERE
      r.user_race_status = 3
      and
      r.activity_distance IS NOT NULL
      AND r.activity_duration IS NOT NULL
      and
      r.map_id is not null
      and
      r.activity_distance >= m1.race_total_distance * 1000
      GROUP BY
      r.user_id,
      FROM_UNIXTIME(r.time_stamp, "%Y-%m-%d"),
      r.map_id
    ) as r1
  INNER JOIN
  race_data AS r2
  ON
  r2.activity_duration = r1.min_duration
  AND
  r2.user_id = r1.user_id
  and
  r1.map_id = r2.map_id
  and
  r1.date = FROM_UNIXTIME(r2.time_stamp, "%Y-%m-%d")
  WHERE r2.user_race_status = 3
  and
  r2.activity_distance IS NOT NULL
  AND r2.activity_duration IS NOT NULL
  and
  r2.map_id is not null
)b,
user_profile as p,
race_map_info as m
where
b.user_id = p.user_id
and
b.map_id = m.map_index
  and
  b.offical_time >= 10
  and
  b.activity_distance >= m.race_total_distance * 1000
  ;
  `;
    con.query(sql2, 'run_rank', function(err, rows) {
      if (err) {
        throw err;
      }
      res.send('complete update!!');
    });
  }
);

router.get('/', function(req, res, next) {
  const {
    con,
    query: {
      pageNumber,
      pageSize,
      month,
      mapId,
      gender,
      userId,
      email,
      phone,
      userName,
      startDate,
      endDate,
      event_id,
      isGetUpdateTime
    }
  } = req;
  let sql = '';
  if (isGetUpdateTime) {
    sql = 'select distinct update_time from run_rank;';
  } else {
    const today = new Date();
    const currMonth = today.getMonth() + 1;
    const currDate = currentDate();
    const genderQuery = gender ? `and a.gender = ${gender}` : '';
    const eventQuery = event_id
      ?
      `and
      (
        (c.phone is not NULL and c.phone != '' and c.phone like concat('%', b.phone, '%'))
        or
        (c.e_mail is not NULL and c.e_mail != '' and c.e_mail = b.e_mail)
      )
      and c.event_id = ${event_id}`
      : '';
    const userIdQuery = userId ? `and user_id = ${userId}` : '';
    sql = `
      select distinct a.rank as rank,
      a.offical_time,
      a.user_id,
      a.map_id,
      a.gender,
      a.month,
      a.login_acc,
      a.map_name,
      a.race_category,
      a.race_total_distance
      from
      (
        select *, @prev := @curr, @curr := offical_time,
        @rank := if(@prev = @curr, @rank, @rank+1
      ) as rank
      from (select a.* from ?? a
        , user_race_enroll c
        where
        date between ${con.escape(startDate) || currDate}
        and
        ${con.escape(endDate) || currDate}
        and
        offical_time in
        (
        select min(b.offical_time)  from run_rank as b
        where map_id = ${mapId || 5}
        and
        date between ${con.escape(startDate) || currDate}
        and
        ${con.escape(endDate) || currDate}
        and
        a.user_id = b.user_id
        ${eventQuery}
        )
        and
        map_id = ${con.escape(mapId) || 5}
        ${genderQuery}
        ${userIdQuery}
      )b,
      (
        select @curr := null, @prev :=null, @rank := 0
      )
      time order by offical_time
      )a;
    `;
  }
  con.query(sql, 'run_rank', function(err, rows) {
    if (err) {
      throw err;
    }
    const meta = {
      pageSize: pageSize || 10,
      pageCount: rows.length,
      pageNumber: Number(pageNumber) || 1
    };
    if (isGetUpdateTime) return res.json(rows[0].update_time);
    if (userName) {
      let idx = rows.findIndex(_row => _row.login_acc === userName);
      const halfRange = 5;
      let start = 0;
      if (idx === -1) {
        return res.send({ datas: [] });
      }
      if (idx - halfRange < 0) {
        start = 0;
      } else {
        start = idx - halfRange;
      }

      const end = halfRange * 2 + 1;
      let datas = rows.splice(start, end);
      return res.json({ datas });
    }
    if (email) {
      let idx = rows.findIndex(
        _row => encodeURIComponent(_row.e_mail) === email
      );
      const halfRange = 5;
      let start = 0;
      if (idx === -1) {
        return res.send({ datas: [] });
      }
      if (idx - halfRange < 0) {
        start = 0;
      } else {
        start = idx - halfRange;
      }

      const end = halfRange * 2 + 1;
      let datas = rows.splice(start, end);
      return res.json({ datas });
    } else if (phone) {
      let idx = rows.findIndex(_row => _row.phone === phone);
      const halfRange = 5;
      let start = 0;
      if (idx === -1) {
        return res.send({ datas: [] });
      }
      if (idx - halfRange < 0) {
        start = 0;
      } else {
        start = idx - halfRange;
      }

      const end = halfRange * 2 + 1;
      let datas = rows.splice(start, end);
      return res.json({ datas });
    } else {
      datas = rows.splice((meta.pageNumber - 1) * meta.pageSize, meta.pageSize);
    }
    res.json({ datas, meta });
  });
});

router.get('/rankInfo/map', function(req, res, next) {
  const { con } = req;
  const sql = `
    select
    distinct map_name,
    race_total_distance as distance,
    map_id
    from ?? ;
  `;
  con.query(sql, 'run_rank', function(err, rows) {
    if (err) {
      console.log(err);
    }
    res.json(rows);
  });
});

router.get('/rankInfo/month', function(req, res, next) {
  const { con } = req;
  const sql = `SELECT month FROM ?? GROUP BY month;`;
  con.query(sql, 'run_rank', function(err, rows) {
    if (err) {
      console.log(err);
    }
    res.json(rows);
  });
});

router.get('/rankInfo/email', function(req, res, next) {
  const {
    con,
    query: {
      email,
      startDate,
      start_date_time,
      end_date_time,
      endDate,
      mapId,
      keyword,
      gender,
      event_id,
      isRealTime
    }
  } = req;
  const genderQuery = gender ? `and gender = ${gender}` : '';
  let sql = '';
  if (isRealTime === 'true') {
    sql = `
      select distinct p.e_mail
      from race_data as r,
      user_profile as p,
      user_race_enroll as e
      where r.user_race_status = 3
      and r.time_stamp between ${start_date_time} and ${end_date_time}
      and p.user_id = r.user_id
      and p.e_mail = e.e_mail
      and e.event_id = ${event_id}
      and r.map_id = ${mapId};
    `;
  } else {
    sql = `
    SELECT distinct e_mail FROM ??
    where date between
    '${startDate || currDate}'
    and
    '${endDate || currDate}'
    and map_id = ${mapId}
    and
    e_mail IS NOT NULL
    ${genderQuery};
    `;
  }
  con.query(sql, 'run_rank', function(err, rows) {
    if (err) {
      console.log(err);
    }
    if (keyword.length === 0) {
      return res.send([]);
    }
    let results = rows.map(_row => _row.e_mail);

    results = results.filter(_res => _res.indexOf(keyword) > -1);
    res.json(results);
  });
});

router.get('/rankInfo/userName', function(req, res, next) {
  const {
    con,
    query: {
      keyword,
      startDate,
      endDate,
      mapId,
      gender,
      event_id
    }
  } = req;
  const genderQuery = gender ? `and r.gender = ${gender}` : '';
  const eventQuery = event_id ? `
    and e.event_id = ${event_id}
    and u.event_id = e.event_id
    and (u.e_mail = r.e_mail or u.phone = r.e_mail)
  ` :
  '';
  const sql = `
    select distinct r.login_acc from ?? as r,
    ?? as e,
    ?? as u
    where r.date between
    ?
    and
    ?
    and r.map_id = ?
    and
    r.e_mail IS NOT NULL
    ${eventQuery}
    ${genderQuery};
    ;
  `;
  con.query(sql, ['run_rank', 'race_event_info', 'user_race_enroll', startDate, endDate, mapId] , function(err, rows) {
    if (err) {
      console.log(err);
    }
    if (keyword.length === 0) {
      return res.send([]);
    }
    let results = rows.map(_row => _row.login_acc);

    results = results.filter(_res => _res.toLowerCase().indexOf(keyword.toLowerCase()) > -1);
    res.json(results);
  });
});
router.get('/rankInfo/phone', function(req, res, next) {
  const {
    con,
    query: {
      startDate,
      start_date_time,
      end_date_time,
      endDate,
      mapId,
      keyword,
      gender,
      event_id,
      isRealTime
    }
  } = req;
  const genderQuery = gender ? `and gender = ${gender}` : '';
  let sql = '';
  if (isRealTime === 'true') {
    sql = `
      select distinct p.phone
      from race_data as r,
      user_profile as p,
      user_race_enroll as e
      where r.user_race_status = 3
      and r.time_stamp between ${start_date_time} and ${end_date_time}
      and p.user_id = r.user_id
      and
      p.phone IS NOT NULL
      and
      e.phone IS NOT NULL
      and p.phone = e.phone
      and e.event_id = ${event_id}
      and r.map_id = ${mapId};
    `;
  } else {
    sql = `
    SELECT distinct phone, country_code FROM ??
    where date between
    '${startDate || currDate}'
    and
    '${endDate || currDate}'
    and
    phone IS NOT NULL
    and map_id = ${mapId}
    ${genderQuery};
    `;
  }
  con.query(sql, 'run_rank', function(err, rows) {
    if (err) {
      console.log(err);
    }
    if (keyword.length === 0) {
      return res.send([]);
    }
    let results = rows.map(_row => {
      return {
        searchPhone: _row.phone,
        displayPhone: '+' + _row.country_code + ' ' + _row.phone
      };
    });
    results = results.filter(_res => _res.searchPhone.indexOf(keyword) > -1);
    res.json(results);
  });
});

router.get('/mapInfo', function(req, res, next) {
  // 分成兩個fetch是因為有些是測試程式所產生資料，無對應的fileName
  const {
    con,
    query: { userId, mapId, month, isRealTime, start_time, end_time }
  } = req;
  const userQuery = userId ? `and t.user_id = ${userId}` : '';
  const mapQuery = mapId ? `and t.map_id = ${mapId}` : '';
  const monthQuery = month ? `and t.month = ${month}` : '';
  let sql = '';
  if (isRealTime === 'true') {
    sql = `
      select
      r.activity_duration,
      r.user_id,
      r.map_id,
      s.max_speed,
      s.average_speed,
      s.max_pace,
      s.average_pace,
      m.map_name,
      m.race_total_distance,
      m.race_category
      from race_data as r,
      user_profile p,
      sport as s,
      race_map_info m
      where
      user_race_status = 3
      and
      p.user_id = r.user_id
      and
      r.file_name = s.file_name
      and
      r.map_id = m.map_index
      and
      r.user_id = ${con.escape(userId)}
      and
      map_id = ${con.escape(mapId)}
      and
      r.time_stamp
      between
      ${con.escape(start_time)}
      and
      ${con.escape(end_time)}
      order by r.activity_duration
      ;
      select map_name, race_total_distance, race_category
      from race_map_info
      where map_index = ${con.escape(mapId)};
    `;
  } else {
    const sql1 = `
      select t.map_id, t.user_id, s.max_speed,
      s.average_speed, s.max_pace, s.average_pace,
      t.map_name,
      t.race_total_distance,
      t.race_category
      from run_rank as t, sport as s
      where t.file_name = s.file_name
      ${userQuery}
      ${mapQuery}
      ${monthQuery}
      ;
    `;
    const sql2 = `
      select map_name, race_total_distance, race_category
      from run_rank
      where map_id = ${con.escape(mapId)}
      and
      user_id = ${con.escape(userId)}
    `;
    sql = `${sql1}${sql2}`;
  }
  con.query(`${sql}`, function(err, results) {
    if (err) {
      console.log(err);
    }
    if (!isRealTime) {
      if (results[0].length === 0) {
        res.json(results[1][0]);
      } else {
        res.json(results[0][0]);
      }
    } else {
      if (results[0].length > 0) {
        res.json(results[0][0]);
      } else {
        res.json(results[1][0]);
      }
    }
  });
});

router.post('/fakeData', async (req, res) => {
  const {
    body: {
      offical_time,
      date,
      map_id,
      gender,
      userName,
      email,
      map_name,
      user_id,
      phone,
      country_code,
      race_total_distance,
      race_category
    },
    con
  } = req;

  try {
    const trimEmail = email.trim();
    const e_mail = trimEmail.toLowerCase();
    const login_acc = userName.trim();
    const sql = `
    INSERT INTO ?? (
      offical_time,
      date,
      map_id,
      gender,
      login_acc,
      e_mail,
      map_name,
      user_id,
      phone,
      country_code,
      race_category,
      race_total_distance
    )
    value (
      '${offical_time}',
      '${date}',
      ${map_id},
      ${gender},
      '${login_acc}',
      '${e_mail}',
      '${map_name}',
      '${user_id}',
      '${phone}',
      '${country_code}',
      '${race_category}',
       ${race_total_distance}
    );`;
    await con.query(sql, 'run_rank', async (err, rows) => {
      if (err) {
        console.log('!!!!!', err);
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      res.send({
        offical_time,
        date,
        map_id,
        gender,
        userName,
        email,
        map_name,
        race_category,
        race_total_distance
      });
    });
  } catch (err) {
    res.status(500).send({
      errorMessage: '請檢查假資料欄位格式是否正確'
    });
  }
});

router.post('/fakeData/race_data', async (req, res) => {
  const {
    body: { activity_duration, map_id, user_id, email, userName },
    con
  } = req;
  try {
    const trimEmail = email.trim();
    const e_mail = trimEmail.toLowerCase();
    const login_acc = userName.trim();
    const sql = `
    INSERT INTO race_data (
      activity_duration,
      map_id,
      user_id
    )
    value (
      '${activity_duration}',
      ${map_id},
      ${user_id}
    );`;
    const sql2 = `
    INSERT INTO user_profile (
      user_id,
      e_mail,
      login_acc
    )
    value (
      ${user_id},
      '${e_mail}',
      '${login_acc}'
    );`;
    await con.query(`${sql}${sql2}`, async (err, rows) => {
      if (err) {
        console.log('!!!!!', err);
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      res.send({
        activity_duration,
        map_id,
        user_id,
        time_stamp,
        email,
        login_acc
      });
    });
  } catch (err) {
    res.status(500).send({
      errorMessage: '請檢查假資料欄位格式是否正確'
    });
  }
});
routerProtected.get('/todayRank', function(req, res, next) {
  const { con, query: { start_date, end_date, map_id } } = req;
  const sql = `
SELECT distinct a.rank AS rank
     , a.map_id
     , a.activity_duration
     , a.user_race_status
     , a.e_mail
     , a.login_acc
     , a.gender
  FROM (SELECT race_id
             , r.map_id
             , r.activity_duration
             , r.user_race_status
             , p.e_mail
             , p.login_acc
             , p.gender
             , @prev := @curr
             , @curr := r.activity_duration
             , @rank := IF(@prev = @curr, @rank, @rank + 1) AS rank
          FROM race_data as r,
          user_profile as p,
          race_map_info as m
             , (SELECT @curr := null
                     , @prev := null
                     , @rank := 0) s
          where r.user_race_status = 3
          and
          r.user_id = p.user_id
	  and
          r.map_id = m.map_index
          and
          r.activity_distance >= m.race_total_distance * 1000
          and
          r.activity_duration > '00:00:10.000'
          and
          r.time_stamp
          between ${start_date} and ${end_date}
          and
          r.map_id = ${map_id}
          ) a;
;`;
  con.query(sql, 'race_event_info', function(err, rows) {
    if (err) {
      return res.status(500).send(err);
    }
    return res.json(rows);
  });
});

router.get('/eventRank', function(req, res, next) {
  const {
    con,
    query: {
      start_date_time,
      end_date_time,
      event_id,
      email,
      pageSize,
      pageNumber,
      mapId,
      gender
    }
  } = req;
  const genderQuery = gender ? `and p.gender = ${gender}` : '';
  const sql = `
  select distinct
  b.user_id,
  b.offical_time,
  b.map_id,
  p.e_mail,
  p.login_acc,
  p.gender,
  p.phone,
  m.map_name
  from (
  SELECT
    distinct
    t2.user_id,
    t2.user_race_status,
    t2.activity_duration as offical_time,
    t2.average_speed,
    t2.map_id,
    t2.activity_distance
    FROM (
      SELECT user_id,
      MIN(activity_duration) AS min_duration
      FROM race_data
      WHERE
      time_stamp between ${start_date_time} and ${end_date_time}
      and
      file_name IS NOT NULL
      and
      activity_distance IS NOT NULL
      and
      user_race_status = 3
      and
      map_id = ${mapId}
      AND activity_duration IS NOT NULL GROUP BY user_id
    ) AS t1
    INNER JOIN
    race_data AS t2
    ON
    t2.activity_duration = t1.min_duration
    AND
    t2.user_id = t1.user_id
    WHERE user_race_status = 3
    and
    time_stamp between ${start_date_time} and ${end_date_time}
    and
    t2.map_id = ${mapId}
  )b,
  user_profile as p,
  user_race_enroll as e,
  race_map_info as m
  where
  b.user_id = p.user_id
  ${genderQuery}
  and
  b.map_id = m.map_index
  and
  b.activity_distance >= m.race_total_distance * 1000
  and
  p.e_mail = e.e_mail
  and
  e.event_id = ${event_id}
  order by b.offical_time
  ;
`;
  con.query(sql, 'race_event_info', function(err, rows) {
    if (err) {
      return res.status(500).send(err);
    }
    const meta = {
      pageSize: pageSize || 10,
      pageCount: rows.length,
      pageNumber: Number(pageNumber) || 1
    };
    if (email) {
      let idx = rows.findIndex(
        _row => encodeURIComponent(_row.e_mail) === email
      );
      const halfRange = 5;
      let start = 0;
      if (idx === -1) {
        return res.send({ datas: [] });
      }
      if (idx - halfRange < 0) {
        start = 0;
      } else {
        start = idx - halfRange;
      }

      const end = halfRange * 2 + 1;
      let datas = rows.splice(start, end);
      return res.json({ datas });
    } else {
      datas = rows.splice((meta.pageNumber - 1) * meta.pageSize, meta.pageSize);
    }
    res.json({ datas, meta });
  });
});
// Exports
module.exports = {
  protected: routerProtected,
  unprotected: router
};

