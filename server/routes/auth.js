var express = require('express');

var router = express.Router();

router.get('/strava/callback', function (req, res, next) {
  const { query: { code, type}  } = req;
  // https://www.strava.com/oauth/authorize?client_id=23461&response_type=code&redirect_uri=https://192.168.1.235:3000/nodejs/api/auth/strava/callback?type=2&approval_prompt=force
  switch (type) {
    case '1':
      res.redirect(`http://192.168.1.235:8080/dashboard/settings/account-info?code=${code}`);
      break;
    case '2':
      res.redirect(`https://app.alatech.com.tw/dashboard/settings/account-info?code=${code}`);
      break;
    case '3':
      res.redirect(`http://localhost/?state=mystate&code=${code}`);
      break;
    case '4':
      res.redirect(`ALAconnect://3rd.strava?state=mystate&code=${code}`);
      break;
    default:
      res.redirect('https://app.alatech.com.tw/404');
  }
});

// Exports
module.exports = router;
