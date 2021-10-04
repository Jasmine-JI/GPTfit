const express = require('express');
const searchNickname = require('../models/user_id').searchNickname;
const getUserList = require('../models/user_id').getUserList;
const router = express.Router();
const checkAccessRight = require('../models/auth.model').checkAccessRight;
const checkNicknameRepeat = require('../models/user_id').checkNicknameRepeat;

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

router.post('/userAvartar', function (req, res, next) {
  const {
    con,
    body: {
      token,
      userId
    }
  } = req;

  checkAccessRight(token, 29).then(_res => {
    if (_res) {

      let keyword;
      if (Array.isArray(userId)) {
        keyword = 'in (?)';
      } else {
        keyword = '= ?';
      }

      const sql = `
        select
          user_id as userId,
          login_acc as userName,
          icon_small as smallIcon,
          icon_middle as middleIcon,
          icon_large as largeIcon,
          e_mail as email,
          phone,
          country_code as countryCode,
          active_status as enableStatus,
          time_stamp as lastLogin,
          register_category as accountType,
          timestamp_reset_passwd as lastResetPwd,
          gender,
          birthday
        from ??
        where user_id ${keyword};
      `

      con.query(sql, ['user_profile', userId], function (err, rows) {
        if (err) {
          console.log(err);
          return res.status(500).send({
            errorMessage: err.sqlMessage
          });
        }

        if (rows.length > 0 && Array.isArray(userId)) {

          res.json({
            resultCode: 200,
            userList: rows
          })

        } else if (rows.length > 0) {
          const row = rows[0];
          res.json({
            resultCode: 200,
            userId: row.userId,
            userName: row.userName,
            smallIcon: row.smallIcon,
            middleIcon: row.middleIcon,
            largeIcon: row.largeIcon,
            email: row.email || '',
            countryCode: row.countryCode || '',
            phone: row.phone || '',
            enableStatus: row.enableStatus,
            lastLogin: row.lastLogin,
            lastResetPwd: row.lastResetPwd,
            gender: row.gender,
            birthday: row.birthday,
            accountType: +row.accountType
          })

        } else {
          res.json({
            resultCode: 200,
            userName: '',
            smallIcon: '',
            middleIcon: '',
            largeIcon: '',
            email: '',
            countryCode: null,
            phone: null,
            enableStatus: null,
            lastLogin: null,
            lastResetPwd: null,
            gender: null,
            birthday: null,
            userList: [],
            accountType: null
          })

        }

      });
    } else {
      res.json({
        resultCode: 403,
        rtnMsg: '你沒權限~'
      });
    }

  });
});

// 使用關鍵字尋找相關暱稱(auto complete list)-kidin-1090908
router.post('/search_nickname', function (req, res, next) {
  const {
    con,
    body
  } = req;

  const result = searchNickname(body.keyword).then(result => {
    if (result) {
      return res.json({
        resultCode: 200,
        resultMessage: "Get result success.",
        nickname: result
      });

    } else {
      return res.json({
        resultCode: 400,
        resultMessage: "Not found.",
      })

    }

  });

});

// userId[]查找暱稱-kidin-1090923
router.post('/getUserList', function (req, res, next) {
  const {
    con,
    body
  } = req;

  if (body.userIdList.length === 0) {

    return res.json({
      apiCode: 'N9001', // 暫定
      resultCode: 200,
      resultMessage: "Get result success.",
      nickname: []
    });

  } else {
    const result = getUserList(body.userIdList).then(resp => {

      if (resp) {

        const resList = [];
        body.userIdList.forEach(_list => {

          resp.forEach(__resp => {

            if (_list === +__resp.userId) {
              resList.push(__resp);
            }

          });

        });

        return res.json({
          apiCode: 'N9001', // 暫定
          resultCode: 200,
          resultMessage: "Get result success.",
          nickname: resList
        });

      } else {
        return res.json({
          apiCode: 'N9001', // 暫定
          resultCode: 400,
          resultMessage: "Get result failed.",
        })

      }

    });

  }

});

/**
 * 確認暱稱是否重複
 */
router.post('/checkNickname', function (req, res, next) {
  const {
    con,
    body
  } = req;

  const result = checkNicknameRepeat(body.nickname).then(result => {
    if (result && result.length > 0) {

      return res.json({
        apiCode: 'N9002',  // 暫定
        resultCode: 200,
        repeat: true,
        resultMessage: "Get result success.",
      });

    } else if (result && result.length === 0) {

      return res.json({
        apiCode: 'N9002',
        resultCode: 200,
        repeat: false,
        resultMessage: "Get result success.",
      })

    } else {

      return res.json({
        apiCode: 'N9002',
        resultCode: 400,
        resultMessage: "Get result failed.",
      })

    }

  });

});

// Exports
module.exports = router;
