var express = require('express');
var async = require('async');
var router = express.Router();
var { getUserId } = require('../models/user_id');
var { getInnerAdmin } = require('../models/exist_innerAdmin');
var { getAccessRight } = require('../models/get_accessRight');

var moment = require('moment');

// apiCode-center01:取得個人相關群組清單
router.get('/getGroupList', function (req, res, next) {
  const { con } = req;

  const token = req.headers['authorization'];
  getUserId(token).then((userId) => {
    const sql = `
      select g.group_name as groupName, g.group_id as groupId,
      m.access_right as accessRight, m.join_status as JoinStatus
      from ?? g, ?? m
      where g.group_id = m.group_id and m.member_id = ? and g.group_status != 4;
    `;
    con.query(sql, ['group_info', 'group_member_info', userId], function (err, rows) {
      if (err) {
        console.log(err);
        return res.status(500).send({
          errorMessage: err.sqlMessage,
        });
      }
      const systemManagerIdx = rows.findIndex((_row) => +_row.accessRight < 30);
      let results = rows.filter(
        (_row) => _row.JoinStatus === 2 && +_row.accessRight >= 30 && +_row.accessRight <= 80
      );
      if (rows && systemManagerIdx > -1) {
        results.push(rows[systemManagerIdx]); // 因為預設0-0-0-0-0-0的join_status為1
        return res.json(results);
      } else {
        return res.json(results);
      }
    });
  });
});

router.post('/innerAdmin', function (req, res, next) {
  const {
    con,
    body: { targetRight, userIds },
  } = req;
  const token = req.headers['authorization'];
  return getAccessRight(token, targetRight).then((isAllow) => {
    if (isAllow) {
      return getInnerAdmin(targetRight)
        .then((ids) => {
          let normalIds = [];
          if (ids.length > 0) {
            normalIds = ids.filter(
              (_id) => userIds.findIndex((_userId) => +_userId === _id.member_id) === -1
            );
          }
          normalQuerys = normalIds.map(
            (_id) =>
              `update ?? set access_right = 90 where member_id = ${_id.member_id} and group_id = '0-0-0-0-0-0';`
          );
          let sql = userIds.map(
            (_id) =>
              `update ?? set access_right = ${con.escape(
                targetRight
              )} where member_id = ${_id} and group_id = '0-0-0-0-0-0';`
          );
          sql = sql.concat(normalQuerys);
          let successCount = 0;
          const processer = function (query) {
            con.query(query, ['group_member_info'], function (err, results) {
              if (err) {
                console.log(err);
                return res.status(500).send({
                  errorMessage: err.sqlMessage,
                });
              }
              if (results) {
                successCount++;
                if (successCount === sql.length) {
                  res.json({
                    resultCode: 200,
                    rtnMsg: 'success',
                  });
                }
              }
            });
          };
          async.eachLimit(sql, 100, processer, function (error, result) {
            console.log('!!!!!');
            console.log('error: ', error);
            console.log('result: ', result);
          });
        })
        .catch((error) => console.log(error));
    }
    return res.json({
      resultCode: 403,
      rtnMsg: '你沒權限~',
    });
  });
});

router.get('/innerAdmin', function (req, res, next) {
  const {
    con,
    query: { groupId },
  } = req;
  const sql = `
    select m.group_id as groupId, m.access_right as accessRight,
    u.user_id as userId, u.login_acc as userName, g.group_name as groupName
    from group_member_info m, group_info g, user_profile u
    where m.access_right < 30 and m.group_id = g.group_id and u.user_id = m.member_id;
  `;
  con.query(sql, ['group_member_info', 'group_info'], function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage,
      });
    }
    if (rows) {
      return res.json(rows);
    }
  });
});

router.get('/searchMember', function (req, res, next) {
  const {
    con,
    query: {
      keyword,
      groupId,
      accessRight,
      type, // 0: 沒有權限的篩選， 1: 有
      searchType, // 1: userId 2:帳號
    },
  } = req;

  const token = req.headers['authorization'];
  getUserId(token).then((_res) => {
    if (res) {
      if (+searchType === 1) {
        const groupIdQuery = groupId && groupId.length > 0 ? ` and g.group_id = ?` : '';
        let additionalVal = groupId;
        if (type === '1') {
          additionalVal = accessRight;
        }
        const accessRightQuery =
          accessRight && accessRight.length > 0 ? ` and m.access_right = ?` : '';

        const sql = `
          select u.login_acc as userName, g.group_name as groupName, m.member_id as userId
          from ?? m, ?? g, ?? u
          where u.login_acc like '%' ? '%' and g.group_id = m.group_id and m.member_id = u.user_id ${groupIdQuery} ${accessRightQuery};
        `;
        con.query(
          sql,
          ['group_member_info', 'group_info', 'user_profile', keyword, additionalVal],
          function (err, rows) {
            if (err) {
              console.log(err);
              return res.status(500).send({
                errorMessage: err.sqlMessage,
              });
            }
            if (rows) {
              return res.json(rows);
            }
          }
        );
      } else {
        const phoneReg = /^([0-9]+)$/,
          emailReg = /^\S{1,63}@[a-zA-Z0-9]{2,63}.[a-zA-Z]{2,63}(.[a-zA-Z]{2,63})?$/;

        let sql = '';
        if (phoneReg.test(keyword)) {
          sql = `select user_id, login_acc, phone as phone from ?? where phone like '%' ? '%'`;
        } else {
          sql = `select user_id, login_acc, e_mail as e_mail from ?? where e_mail like '%' ? '%'`;
        }

        con.query(sql, ['user_profile', keyword], function (err, rows) {
          if (err) {
            console.log(err);
            return res.status(500).send({
              errorMessage: err.sqlMessage,
            });
          }
          if (rows) {
            return res.json(rows);
          }
        });
      }
    } else {
      res.json({
        resultCode: 403,
        rtnMsg: '你沒權限~',
      });
    }
  });
});

router.post('/actionGroup', function (req, res, next) {
  const {
    con,
    body: { groupId, actionType },
  } = req;
  const token = req.headers['authorization'];
  getUserId(token).then(
    (userId) => {
      const sql = `
      select m.join_status, g.group_status from ?? m, ?? g
      where
      m.member_id = ? and m.group_id = ?;
      select m.access_right, m.member_name from ?? m
      where
      m.member_id = ?;
      select g.group_status from ?? g
      where
      g.group_id = ? ;
    `;
      con.query(
        sql,
        [
          'group_member_info',
          'group_info',
          userId,
          groupId,
          'group_member_info',
          userId,
          'group_info',
          groupId,
        ],
        function (err, results) {
          if (err) {
            console.log(err);
            return res.status(500).send({
              errorMessage: err.sqlMessage,
            });
          }
          if (results[0].length > 0) {
            const { join_status, group_status } = results[0][0];
            const sqlUpdate1 =
              group_status === 1
                ? `update ?? set join_status = 2 where member_id = ? and group_id = ?;select join_status from ?? where member_id = ? and group_id = ?;`
                : `update ?? set join_status = 1 where member_id = ? and group_id = ?;select join_status from ?? where member_id = ? and group_id = ?;`;
            const sqlDelete1 = 'delete from  ?? where member_id = ? and group_id = ?;';
            if (actionType === 2) {
              con.query(
                sqlDelete1,
                ['group_member_info', userId, groupId, 'group_member_info', userId, groupId],
                function (err, rows) {
                  if (err) {
                    console.log(err);
                    return res.status(500).send({
                      errorMessage: err.sqlMessage,
                    });
                  }
                  if (rows.affectedRows > 0) {
                    res.json({
                      resultCode: 200,
                      rtnMsg: 'Leave Group success',
                    });
                  } else {
                    res.status(400).json({
                      resultCode: 400,
                      rtnMsg: 'Leave Group fail, group is not exist.',
                    });
                  }
                }
              );
            } else {
              if (join_status === 1) {
                con.query(
                  sqlUpdate1,
                  ['group_member_info', userId, groupId, 'group_member_info', userId, groupId],
                  function (err, rows) {
                    if (err) {
                      console.log(err);
                      return res.status(500).send({
                        errorMessage: err.sqlMessage,
                      });
                    }
                    const joinStatus = rows[1][0].join_status;
                    if (rows[0].affectedRows === 0) {
                      res.status(400).json({
                        joinStatus,
                        resultCode: 400,
                        rtnMsg: 'already send joinning request',
                      });
                    } else {
                      res.json({
                        joinStatus,
                        resultCode: 200,
                        rtnMsg: 'Join Group success',
                      });
                    }
                  }
                );
              } else if (join_status === 2) {
                res.status(400).json({
                  resultCode: 400,
                  rtnMsg: 'already in the group',
                });
              } else {
                res.status(400).json({
                  resultCode: 400,
                  rtnMsg: 'need to send request again.',
                });
              }
            }
          } else {
            const { access_right, member_name } = results[1][0];
            const { group_status } = results[2][0];
            const sqlUpdate2 =
              group_status === 1
                ? `insert into  ??  values(?, ?, ?, ?, 2, ?);select join_status from ?? where member_id = ? and group_id = ?`
                : `insert into  ??  values(?, ?, ?, ?, 1, ?);select join_status from ?? where member_id = ? and group_id = ?`;
            con.query(
              sqlUpdate2,
              [
                'group_member_info',
                groupId,
                access_right,
                userId,
                member_name,
                moment().format('YYYY-MM-DD HH:mm:ss'),
                'group_member_info',
                userId,
                groupId,
              ],
              function (err, rows) {
                if (err) {
                  console.log(err);
                  return res.status(500).send({
                    errorMessage: err.sqlMessage,
                  });
                }
                const joinStatus = rows[1][0].join_status;
                if (rows[0].affectedRows > 0) {
                  if (group_status === 1) {
                    res.json({
                      joinStatus,
                      resultCode: 200,
                      rtnMsg: 'Join Group success.',
                    });
                  } else {
                    res.json({
                      joinStatus,
                      resultCode: 200,
                      rtnMsg: 'send enter group request success.',
                    });
                  }
                } else {
                  res.status(400).json({
                    joinStatus,
                    resultCode: 400,
                    rtnMsg: 'send enter group request fail.',
                  });
                }
              }
            );
          }
        }
      );
    },
    (err) => res.status(400).json({ rtnMsg: 'token is invalid' })
  );
});

// Exports
module.exports = router;
