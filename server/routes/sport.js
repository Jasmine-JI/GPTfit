var express = require('express');
var router = express.Router();

// for demo 類圖床
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
// Exports
module.exports = router;
