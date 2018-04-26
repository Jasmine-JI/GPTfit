const db = require('./connection_db');

exports.checkEventId = function(eventId) {
  let result = {};
  return new Promise((resolve, reject) => {
    if (eventId) {
      db.query(
        `SELECT session_id FROM ?? WHERE event_id = ?`,
        ['race_event_info', eventId],
        function(err, rows) {
          if (err) {
            result.status = '系統異常';
            result.err = 'eventId未傳入';
            reject(result);
          }
          if (rows.length === 0) {
            return resolve(true);
          } else {
            return resolve(false);
          }
        }
      );
    } else {
      return resolve(false);
    }
  });


}
exports.checkSessionExit =  function (eventId, sessions) {
  let result = {};
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT session_id FROM ?? WHERE event_id = ${eventId}`,
      'race_event_info',
      function(err, rows) {
        if (err) {
          result.status = '登入失敗。';
          result.err = '伺服器錯誤，請稍後在試！';
          reject(result);
          return;
        }
        if (rows) {
          rows = rows.map(_row => _row.session_id);
          const sessionIds = sessions.map(_session => {
            if (_session.session_id === null) {
              return null;
            } return Number(_session.session_id);
          });
          rows = rows.filter(_row => {
            if (_row !== null) {
              return sessionIds.findIndex(_id => _id === _row) === -1;
            }
          });
          resolve(rows);
        }
      }
    );
  });
};
