var express = require('express');

var router = express.Router();

router.get('/getEmail', function (req, res, next) {
  const {
    con,
    query: { code }
  } = req;
  const sql = `
  SELECT  e_mail FROM ??
  where md5_reset_passwd = ${con.escape(code)};`;

  con.query(sql, 'user_profile', function (err, rows) {
    if (err) {
      console.log(err);
    }
    if(rows[0]) return res.json({ email: rows[0].e_mail });
    return res.json('noemail');
  });
});


// Exports
module.exports = router;
