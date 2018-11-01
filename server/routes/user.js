var express = require('express');

var router = express.Router();

router.get('/userProfile', function (req, res, next) {
  const {
    con,
    query: { userId }
  } = req;
  const sql = `
    select distinct u.login_acc, u.icon_large as userIcon from
    ?? u where user_id = ?;
  `;
  con.query(sql, ['user_profile', userId], function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    let userName = '';
    let userIcon = '';
    if (rows.length > 0) {
      userName = rows[0].login_acc;
      userIcon = rows[0].userIcon;
    }

    res.json({
      userName,
      userIcon
    });
  });
});

// Exports
module.exports = router;
