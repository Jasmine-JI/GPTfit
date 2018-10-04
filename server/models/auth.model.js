const db = require('./connection_db');

exports.checkTokenExit = function (token) {
  let result = {};
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT access_token FROM ?? WHERE access_token = ?`,
      ['user_profile', token],
      function (err, rows) {
        if (err) {
          console.log(err);
          result.status = '驗證失敗。';
          result.err = '伺服器錯誤，請稍後在試！我是token失敗';
          return reject(err);
        }
        if (rows.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
  });
};

