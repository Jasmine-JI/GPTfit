const db = require('./connection_db');

exports.getInnerAdmin = function (accessRight) {
  let result = {};
  return new Promise((resolve) => {
    db.query(
      `SELECT member_id from ?? where access_right = ?;`, ['group_member_info', accessRight],
      function (err, rows) {
        if (err) {
          result.status = '驗證失敗。';
          result.err = '伺服器錯誤，請稍後在試！';
          return;
        }
        if (rows) {
          resolve(JSON.parse(JSON.stringify(rows)));
        }
        return;
      }
    );
  });
};
