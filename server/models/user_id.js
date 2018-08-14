const db = require('./connection_db');

exports.getUserId = function (token) {
  let result = {};
  return new Promise((resolve, reject) => {
    console.log('reject: ', reject);
    db.query(
      `SELECT user_id FROM ?? WHERE access_token = ?`, ['user_profile', token],
      function (err, rows) {
        if (err) {
          result.status = '驗證失敗。';
          result.err = '伺服器錯誤，請稍後在試！';
          reject(result);
          return;
        }
        if (rows.length > 0) {
          resolve(rows[0].user_id);
        } else {
          result.status = '無此使用者。';
          result.err = '搜尋失敗！';
          reject(result);
          return;
        }
      }
    );
  });
};
