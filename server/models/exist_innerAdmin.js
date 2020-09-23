const db = require('./connection_db');

exports.getInnerAdmin = function (targetRight) {
  let result = {};
  return new Promise((resolve) => {
    const sql1 = `
      SELECT member_id from ?? where access_right = ? ;
    `;
    db.query(sql1, ['group_member_info', targetRight],
      function (err, rows) {
        if (err) {
          result.status = '驗證失敗。';
          result.err = '伺服器錯誤，請稍後在試！';
          console.log(err);
          return;
        }
        if (rows) {
          return resolve(JSON.parse(JSON.stringify(rows)));
        }
      }
    );
  });
};

exports.getGroupNameList = function (list) {

  return new Promise((resolve) => {
    db.query(
      `SELECT group_id as groupId, group_name as groupName FROM ?? where group_id in (?) `, ['group_info', list],
      function (err, rows) {
        if (err) {
          return reject(false);
        }

        if (rows.length > 0) {
          return resolve(rows);
        } else {
          return reject(false);
        }

      }

    );

  });

};
