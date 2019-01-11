var express = require('express');
var router = express.Router();

router.get('/sportList', (req, res, next) => {
  const {
    con,
    query: {
      page,
      pageCounts,
      sort
    }
  } = req;

  const token = req.headers['authorization'];
  const sortQuery = sort === 'asc' ? 'order by file_name' : 'order by file_name desc';
  const sql = `
    select
    s.file_name as startTime, s.sport_category as type,
    s.average_speed as avgSpeed, s.average_heart_rate as avgHeartRateBpm,
    s.distance as totalDistanceMeters, s.sport_duration as totalSecond,
    s.calories
    from ?? s,
    ?? u
    where u.user_id = s.user_id
    and u.access_token = ?
    ${sortQuery};`;
  con.query(sql, ['sport', 'user_profile', token], function (err, rows) {
    if (err) {
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
  const totalCounts = rows.length;

    const datas = rows.splice(page * (pageCounts || 10), (pageCounts || 10));
    res.status(200).json({
      activityInfoLayer: datas,
      totalCounts
    });
  });
});
router.get('/sportListDetail', (req, res, next) => {
  const {
    con,
    query: {
      fileId
    }
  } = req;

  const token = req.headers['authorization'];
  const sql1 = `
    select
    s.file_name as startTime, s.sport_category as type,
    s.average_speed as avgSpeed, s.average_heart_rate as avgHeartRateBpm,
    s.distance as totalDistanceMeters, s.sport_duration as totalSecond,
    s.calories
    from ?? s,
    ?? u
    where u.user_id = s.user_id
    and u.access_token = ?
    and s.file_name = ?
    ;`;
  const sql2 = `
    select r.distance, r.speed, r.altitude as elevation, r.heart_rate as heartRate
    from ?? s,
    ?? u,
    ?? r
    where u.user_id = s.user_id
    and u.access_token = ?
      and s.file_name = ?
      and s.md5_unicode = r.md5_unicode;
  `;
  con.query(`${sql1}${sql2}`, ['sport', 'user_profile', token, fileId,
  'sport', 'user_profile', 'real_time_activity', token, fileId],
  function (err, rows) {
    if (err) {
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    const distances = rows[1].map(_row => _row.distance || 0);
    const speeds = rows[1].map(_row => _row.speed || 0);
    const elevations = rows[1].map(_row => _row.elevation || 0);
    const heartRates = rows[1].map(_row => _row.heartRate || 0);
    res.status(200).json({
      activityInfoLayer: rows[0][0],
      activityPointLayer: {
        distances,
        speeds,
        elevations,
        heartRates
      }
    });
  });
});
// Exports
module.exports = router;
