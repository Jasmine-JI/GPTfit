const express = require('express');
const searchNickname = require('../models/user_id').searchNickname;
const getUserList = require('../models/user_id').getUserList;
const router = express.Router();
const checkAccessRight = require('../models/auth.model').checkAccessRight;
const checkNicknameRepeat = require('../models/user_id').checkNicknameRepeat;
const getTargetInfo = require('../models/user_id').getTargetInfo;

/**
 * 將 api request key 與 schema table 做對應
 */
const tableRename = {
  groupMember: {
    needToken: true,
    originName: 'group_member_info',
    field: {
      accessRight: 'access_right',
      memberId: 'member_id',
      groupId: 'group_id',
    },
  },
  userProfile: {
    needToken: true,
    originName: 'user_profile',
    field: {
      userId: 'user_id',
      nickname: 'login_acc',
      email: 'e_mail',
      gender: 'gender',
      birthday: 'birthday',
      height: 'height',
      weight: 'weight',
      unit: 'use_units',
      country: 'country',
      language: 'language',
      maxHr: 'max_heart_rate',
      restHr: 'rest_heart_rate',
      baseHr: 'base_heart_rate',
      icon: 'avatar_url',
      countryCode: 'country_code',
      phone: 'phone',
      theme: 'theme_img_url',
      counter: 'counter',
      signInType: 'register_category',
    },
  },
  userInfo: {
    needToken: false,
    originName: 'user_profile',
    field: {
      userId: 'user_id',
      nickname: 'login_acc',
      email: 'e_mail',
      icon: 'avatar_url',
      countryCode: 'country_code',
      phone: 'phone',
      theme: 'theme_img_url',
    },
  },
  userApplyInfo: {
    needToken: true,
    originName: 'event_user_profile',
    field: {
      userId: 'user_id',
      eventId: 'target_event_id',
      applyStatus: 'apply_status',
      paidStatus: 'paid_status',
    },
  },
};

router.get('/userProfile', function (req, res, next) {
  const {
    con,
    query: { userId },
  } = req;
  const sql = `
    select distinct u.login_acc, u.icon_large as userIcon from
    ?? u where user_id = ?;
  `;
  con.query(sql, ['user_profile', userId], function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage,
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
      userIcon,
    });
  });
});

router.post('/userAvartar', function (req, res, next) {
  const {
    con,
    body: { token, userId },
  } = req;

  checkAccessRight(token, 29).then((_res) => {
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
      `;

      con.query(sql, ['user_profile', userId], function (err, rows) {
        if (err) {
          console.log(err);
          return res.status(500).send({
            errorMessage: err.sqlMessage,
          });
        }

        if (rows.length > 0 && Array.isArray(userId)) {
          res.json({
            resultCode: 200,
            userList: rows,
          });
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
            accountType: +row.accountType,
          });
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
            accountType: null,
          });
        }
      });
    } else {
      res.json({
        resultCode: 403,
        rtnMsg: '你沒權限~',
      });
    }
  });
});

// 使用關鍵字尋找相關暱稱(auto complete list)-kidin-1090908
router.post('/search_nickname', function (req, res, next) {
  const { con, body } = req;

  const result = searchNickname(body.keyword).then((result) => {
    if (result) {
      return res.json({
        resultCode: 200,
        resultMessage: 'Get result success.',
        list: result,
      });
    } else {
      return res.json({
        resultCode: 400,
        resultMessage: 'Not found.',
      });
    }
  });
});

// userId[]查找暱稱-kidin-1090923
router.post('/getUserList', function (req, res, next) {
  const { con, body } = req;

  if (body.userIdList.length === 0) {
    return res.json({
      apiCode: 'N9001', // 暫定
      resultCode: 200,
      resultMessage: 'Get result success.',
      nickname: [],
    });
  } else {
    const result = getUserList(body.userIdList).then((resp) => {
      if (resp) {
        const resList = [];
        body.userIdList.forEach((_list) => {
          resp.forEach((__resp) => {
            if (_list === +__resp.userId) {
              resList.push(__resp);
            }
          });
        });

        return res.json({
          apiCode: 'N9001', // 暫定
          resultCode: 200,
          resultMessage: 'Get result success.',
          nickname: resList,
        });
      } else {
        return res.json({
          apiCode: 'N9001', // 暫定
          resultCode: 400,
          resultMessage: 'Get result failed.',
        });
      }
    });
  }
});

/**
 * 確認暱稱是否重複(可由N9003取代)
 */
router.post('/checkNickname', function (req, res, next) {
  const { con, body } = req;

  const result = checkNicknameRepeat(body.nickname).then((result) => {
    if (result && result.length > 0) {
      return res.json({
        apiCode: 'N9002', // 暫定
        resultCode: 200,
        repeat: true,
        resultMessage: 'Get result success.',
      });
    } else if (result && result.length === 0) {
      return res.json({
        apiCode: 'N9002',
        resultCode: 200,
        repeat: false,
        resultMessage: 'Get result success.',
      });
    } else {
      return res.json({
        apiCode: 'N9002',
        resultCode: 400,
        resultMessage: 'Get result failed.',
      });
    }
  });
});

/**
 * 取得所需之資料
 */
router.post('/alaql', function (req, res, next) {
  const { con, body } = req;

  const { result: translateResult, sql, algebra } = queryTranslate(body);
  if (!translateResult) {
    return res.json({
      apiCode: 'N9003', // 暫定
      resultCode: 400,
      resultMessage: 'Need token or condition.',
    });
  } else {
    const result = getTargetInfo(sql, algebra)
      .then((response) => {
        return res.json({
          apiCode: 'N9003', // 暫定
          resultCode: 200,
          result: response,
          resultMessage: 'Get result success.',
        });
      })
      .catch((error) => {
        return res.json({
          apiCode: 'N9003', // 暫定
          resultCode: 400,
          result: error,
          resultMessage: 'Get result failed.',
        });
      });
  }
});

/**
 * 將request轉為mysql語法（select $target from $table where $condition）
 */
function queryTranslate(body) {
  const { token, search } = body;
  const translateResult = {
    result: false,
    sql: '',
    algebra: [],
  };

  const table = [];
  const condition = [];
  for (let tableName in search) {
    if (!tableRename[tableName]) {
      return translateResult;
    } else {
      const { needToken, originName, field } = tableRename[tableName];
      if (needToken && !token) {
        return translateResult;
      } else {
        table.push(originName);
        const { target, args } = search[tableName];
        translateResult.sql = `select ${getTargetField(field, target, originName)}`;

        if (args) {
          for (let arg in args) {
            const schemaFieldName = field[arg];
            const key = `${originName}.${schemaFieldName}`;
            const value = args[arg];
            condition.push({ key, value });
          }
        }
      }
    }
  }

  if (!token && condition.length === 0) {
    return translateResult;
  } else {
    const [conditionString, algebra] = getCondition(table, condition, token);
    translateResult.algebra = algebra;
    translateResult.sql = `${translateResult.sql} from ${getTargetTable(
      table
    )} where ${conditionString}`;

    translateResult.result = true;
  }

  return translateResult;
}

/**
 * 取得目標欄位字串
 * @param field {Object}-可取得之資料庫欄位
 * @param target {Array<string>}-欲取得之資料庫欄位資料
 * @param originName {string}-資料庫列表名稱
 * @author kidin-1101115
 */
function getTargetField(field, target, originName) {
  let string = '';
  const targetLength = target.length;
  target.forEach((target, index) => {
    const schemaTarget = field[target];
    const addString = index === targetLength - 1 ? '' : ', ';
    string = `${string}${originName}.${schemaTarget} as ${target}${addString}`;
  });

  return string;
}

/**
 * 取得目標列表字串
 * @param table {Array<string>}-目標數據庫列表
 * @author kidin-1101115
 */
function getTargetTable(table) {
  let string = '';
  const tableLength = table.length;
  table.forEach((_table, index) => {
    const addString = index === tableLength - 1 ? '??' : '??, ';
    string = `${string}${addString}`;
  });

  if (!table.includes('user_profile')) string = `${string}, ??`;
  return string;
}

/**
 * 取得條件式字串
 * @param table {Array<string>}-目標數據庫
 * @param condition {Array<string>}-搜尋條件
 * @param token {string}-權杖
 * @author kidin-1101115
 */
function getCondition(table, condition, token) {
  const [...algebra] = table;
  let string = '';
  const conditionLength = condition.length;
  if (token) {
    const userIdCondition = getUserIdCondition(table);
    const haveUserIdCondition = userIdCondition.length > 0;
    const notHaveUserProfile = !algebra.includes('user_profile');
    if (haveUserIdCondition && notHaveUserProfile) {
      algebra.push('user_profile');
    }

    const endString = conditionLength > 0 ? ' and ' : '';
    string = `${string}user_profile.access_token like ?${userIdCondition}${endString}`;
    algebra.push(token);
  }

  let orderBy;
  let finalAlgebra;
  condition.forEach((_condition, index) => {
    const { key, value } = _condition;
    if (Array.isArray(value)) {
      const addString = index + 1 < conditionLength ? '(?) and ' : '(?)';
      algebra.push(value);
      string = `${string}${key} in ${addString}`;
      orderBy = `order by field(${key}, ?) asc`;
      finalAlgebra = [...value];
    } else {
      const addString = index + 1 < conditionLength ? '? and ' : '?';
      algebra.push(value);
      string = `${string}${key} like ${addString}`;
    }
  });

  if (orderBy) {
    string = `${string} ${orderBy}`;
    algebra.push(finalAlgebra);
  }

  string = `${string};`;
  return [string, algebra];
}

/**
 * 根據userId取得條件以串連跨table數據
 * @param table {Array<string>}-目標數據庫
 * @author kidin-1101119
 */
function getUserIdCondition(table) {
  let string = '';
  table.forEach((_table) => {
    if (_table !== 'user_profile') {
      string = `${string} and ${_table}.user_id = user_profile.user_id`;
    }
  });

  return string;
}

// Exports
module.exports = router;
