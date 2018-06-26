var express = require('express');

var router = express.Router();

router.get('/getLogonData', function (req, res, next) {
  const { con } = req;
  const token = req.headers['authorization'];
  const sql = `
    select distinct u.login_acc, u.icon_small, g.access_right from
    ?? u,
    ?? g where g.member_id = u.user_id and access_token = ?;
  `;
  con.query(sql, ['user_profile', 'group_member_info', token], function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    let userRole = [];
    let userName = '';
    let userIcon = '';
    if (rows.length > 0) {
      userRole = rows.map(_row => _row.access_right);
      userName = rows[0].login_acc;
      userIcon = rows[0].icon_small;
    }

    res.json({
      userRole,
      userName,
      userIcon
    });
  });
});

// Exports
module.exports = router;
