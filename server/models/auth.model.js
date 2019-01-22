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
exports.checkAccessRight = function (token) {
  let result = {};
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT m.access_right as accessRight, u.access_token FROM ?? u, ?? m WHERE u.access_token = ? and  u.user_id = m.member_id and m.group_id = '0-0-0-0-0-0'`,
      ['user_profile', 'group_member_info', token],
      function (err, rows) {
        if (err) {
          console.log(err);
          result.status = '驗證失敗。';
          result.err = '伺服器錯誤，請稍後在試！我是token失敗';
          return reject(err);
        }
        if (rows.length > 0) {
          if (+rows[0].accessRight >= 20) {
            console.log('!!!!');
            resolve(true);
          } else {
            resolve(false);
          }

        } else {
          resolve(false);
        }
      }
    );
  });
};

