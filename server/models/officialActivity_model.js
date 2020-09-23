const db = require('./connection_db');

exports.getUserActivityInfo = function (mapId, startTimestamp, endTimestamp, mapDistance, userId) {
  let result = {};
  return new Promise((resolve, reject) => {

    db.query(
      `SELECT
        m.user_id,
        m.file_id,
        m.creation_unix_timestamp,
        SUBSTRING_INDEX(m.cloud_run_map_id, '=', -1),
        a.total_second,
        a.total_distance_meters,
        u.login_acc
       FROM ?? m, ?? a, ?? u
       WHERE
        SUBSTRING_INDEX(m.cloud_run_map_id, '=', -1) = ?
        and a.total_distance_meters / 200 < a.total_step
        and m.creation_unix_timestamp >= ?
        and m.creation_unix_timestamp <= ?
        and m.file_id = a.file_id
        and a.total_distance_meters >= ?
        and u.user_id = m.user_id
        and m.user_id in (?)
       ORDER BY a.total_second ASC
      `,
      ['file_info', 'activity_info', 'user_profile', mapId, startTimestamp, endTimestamp, mapDistance, userId],
      function (err, rows) {
        if (err) {
          console.log(`Error: ${err}`);
          return reject(err);
        }

        if (rows.length > 0) {
          return resolve(rows);
        } else {
          return resolve([]);
        }

      }

    );

  });

};
