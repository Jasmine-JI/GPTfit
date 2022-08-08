var express = require('express');

var router = express.Router();

router.get('/getEmail', function (req, res, next) {
  const {
    con,
    query: { code },
  } = req;
  const sql = `
  SELECT  e_mail, phone FROM ??
  where md5_reset_passwd = ${con.escape(code)};`;

  con.query(sql, 'user_profile', function (err, rows) {
    if (err) {
      console.log(err);
    }
    if (rows[0]) {
      const { e_mail, phone } = rows[0];
      if (e_mail && e_mail.length > 0) {
        return res.json({ email: e_mail });
      } else if (phone && phone.length > 0) {
        return res.json({ email: phone });
      }
    }
    return res.json('noemail');
  });
});

// Exports
module.exports = router;
