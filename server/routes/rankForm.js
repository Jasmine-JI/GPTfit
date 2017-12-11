var express = require('express');

var router = express.Router();
var currentDate = function() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1;  //January is 0!
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = '0' + dd
  }

  if (mm < 10) {
    mm = '0' + mm
  }
  today = yyyy + '-' + mm + '-' + dd;
  return today;
};
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
      startDate,
      endDate
    }
  } = req;

  const today = new Date();
  const currMonth = today.getMonth() + 1;
  const currDate = currentDate();
  const genderQuery = gender ? `and gender = ${gender}` : '';
  const sql = `
    select distinct a.rank as rank,
    a.offical_time,
    a.user_id,
    a.map_id,
    a.date,
    a.gender,
    a.month,
    a.nick_name,
    a.map_name,
    a.race_category,
    a.race_total_distance,
    a.e_mail
    from
    (
      select *, @prev := @curr, @curr := offical_time,
      @rank := if(@prev = @curr, @rank, @rank+1
    ) as rank
    from (select * from ?? a
      where
      date between '${startDate || currDate}'
      and
      '${endDate || currDate}'
      and
      offical_time in
      (
      select min(b.offical_time)  from run_rank as b
      where map_id = ${mapId || 5}
      and
      date between '${startDate || currDate}'
      and
      '${endDate || currDate}'
      and
      a.user_id = b.user_id
      )
      and
      map_id = ${mapId || 5}
      ${genderQuery}
    )b,
    (
      select @curr := null, @prev :=null, @rank := 0
    )
    time order by offical_time
    )a;
  `;
  con.query(sql, 'run_rank', function(err, rows) {
    if (err) {
      throw err;
    }
    const meta = {
      pageSize: pageSize || 10,
      pageCount: rows.length,
      pageNumber: Number(pageNumber) || 1
    };

    if (email) {
      let idx = rows.findIndex(_row => encodeURIComponent(_row.e_mail) === email);
      const halfRange = 5;
      let start = 0;
      if (idx === -1) {
        return res.send({ datas: []});
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
    race_category,
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
    query:{
      email,
      startDate,
      endDate,
      mapId,
      keyword
    }
  } = req;
  const sql = `
  SELECT distinct e_mail FROM ??
  where date between
  '${startDate || currDate}'
  and
  '${endDate || currDate}'
  and map_id = ${mapId};
  `;

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

router.get('/mapInfo', function(req, res, next) { // 分成兩個fetch是因為有些是測試程式所產生資料，無對應的fileName
  const {
    con,
    query: {
      userId,
      mapId,
      month
    }
  } = req;
  const userQuery = userId ? `and t.user_id = ${userId}` : '';
  const mapQuery = mapId ? `and t.map_id = ${mapId}` : '';
  const monthQuery = month ? `and t.month = ${month}` : '';
  const sql1 = `
      select t.map_id, t.user_id,t.e_mail, s.max_speed,
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
      where map_id = ${mapId}
      and
      user_id = ${userId}
    `;
  con.query(`${sql1}${sql2}`, function(err, results) {
    if (err) {
      console.log(err);
    }
    if (results[0].length === 0) {
      res.json(results[1][0]);
    } else {
      res.json(results[0][0]);
    }
  });
});

// Exports
module.exports = router;
