const db = require('./connection_db');

exports.getAccessRight = function (token, targetRight) {
  let result = {};
  return new Promise((resolve, reject) => {
    const sql2 = `
      select m.access_right as accessRight
      from ?? u, ?? m
      where u.user_id = m.member_id
      and u.access_token = ?;
    `;
    db.query(sql2, ['user_profile', 'group_member_info', token],
      function (err, rows) {
        if (err) {
          result.status = '驗證失敗。';
          result.err = '伺服器錯誤，請稍後在試！';
          console.log(err);
          return reject(result);
        }
        const arr = rows.map(_row => _row.accessRight);
        const isAllowUseApi = arr.some(_arr => +_arr <= 29 && +_arr <= targetRight);
        if (isAllowUseApi) {
          return resolve(true);
        }
        return resolve(false);
      }
    );
  });
};
