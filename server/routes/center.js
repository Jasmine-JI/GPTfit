var express = require('express');
var async = require('async')
var router = express.Router();
var { getUserId } = require('../models/user_id');
var { getInnerAdmin } = require('../models/exist_innerAdmin');
var { getAccessRight } = require('../models/get_accessRight');

var moment = require('moment');

router.get('/getGroupListDetail', function (req, res, next) {
  const {
    con,
    query: { groupId }
  } = req;
  const sql = `
    select group_icon,
    group_name, group_desc,
    group_id,
    group_status
    from ?? where group_id = ?;
  `;
  con.query(sql, ['group_info', groupId], function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    if (rows.length > 0) {
      const {
        group_icon,
        group_name,
        group_desc,
        group_id,
        group_status
      } = rows[0];
      res.json({
        rtnMsg: 'Get group list detail success.',
        info: {
          groupId: group_id,
          groupName: group_name,
          groupIcon: group_icon,
          groupDesc: group_desc,
          groupStatus: group_status
        }
      });
    } else {
      res.status(400).json({
        rtnMsg: 'group list detail not found.'
      })
    }

  });
});
router.get('/getGroupJoinStatus', function (req, res, next) {
  const {
    con,
    query: {
      groupId
    }
  } = req;
  const token = req.headers['authorization'];
  getUserId(token).then((userId) => {
    const sql = `
      select join_status from ??
      where
      member_id = ? and group_id = ?;
    `;
    con.query(sql, ['group_member_info', userId, groupId], function (err, rows) {
      if (err) {
        console.log(err);
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      if (rows.length > 0) {
        const {
          join_status
        } = rows[0];
        res.json({
          rtnMsg: 'Get join status success.',
          info: {
            joinStatus: join_status
          }
        });
      } else {
        res.status(200).json({
          rtnMsg: 'join status not found.'
        })
      }
    });
  });

});

router.get('/getGroupList', function (req, res, next) {
  const {
    con
  } = req;

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
          errorMessage: err.sqlMessage
        });
      }
      const systemManagerIdx = rows.findIndex(_row => +_row.accessRight < 30);
      let results = rows.filter(_row =>  _row.JoinStatus === 2 && +_row.accessRight >= 30 && +_row.accessRight <= 80);
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
    body: {
      targetRight,
      userIds
    }
  } = req;
  const token = req.headers['authorization'];
  return getAccessRight(token, targetRight).then((isAllow) => {
    if (isAllow) {
      return getInnerAdmin(targetRight).then((ids) => {
        let normalIds = [];
        if (ids.length > 0) {
          normalIds = ids.filter(_id => userIds.findIndex(_userId => +_userId === _id.member_id) === -1);
        }
        normalQuerys = normalIds.map(_id => `update ?? set access_right = 90 where member_id = ${_id.member_id};`);
        let sql = userIds.map(_id => `update ?? set access_right = ${con.escape(targetRight)} where member_id = ${_id} and group_id = '0-0-0-0-0-0';`);
        sql = sql.concat(normalQuerys);
        const processer = function (query) {
          con.query(query, ['group_member_info'], function (err, rows) {
            if (err) {
              console.log(err);
              return res.status(500).send({
                errorMessage: err.sqlMessage
              });
            }
          });
        }
        res.json({
            resultCode: 200,
            rtnMsg: 'success'
        });
        async.eachLimit(sql, 10, processer, function (error, result){
          console.log('!!!!!');
          console.log('error: ', error);
          console.log('result: ', result);
        });
      }).catch(error => console.log(error));
    }
    return res.json({
      resultCode: 403,
      rtnMsg: '你沒權限~'
    });
  });

});

router.get('/innerAdmin', function (req, res, next) {
  const {
    con,
    query: {
      groupId
    }
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
        errorMessage: err.sqlMessage
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
      type // 0: 沒有權限的篩選， 1: 有
    }
  } = req;
  const groupIdQuery = groupId && groupId.length > 0 ? ` and g.group_id = ?` : '';
  let additionalVal = groupId;
  if (type === '1') {
    additionalVal = accessRight;
  }
  const accessRightQuery = accessRight && accessRight.length > 0 ? ` and m.access_right = ?` : '';

  const sql = `
    select m.member_name as userName, g.group_name as groupName, m.member_id as userId
    from ?? m, ?? g
    where member_name like ? '%' and g.group_id = m.group_id ${groupIdQuery} ${accessRightQuery};
  `;
  con.query(sql, ['group_member_info', 'group_info', keyword, additionalVal], function (err, rows) {
    if (err) {
      console.log(err);
      return res.status(500).send({
        errorMessage: err.sqlMessage
      });
    }
    if (rows) {
      return res.json(rows);
    }
  });

});
router.post('/actionGroup', function (req, res, next) {
  const {
    con,
    body: {
      groupId,
      actionType
    }
  } = req;
  const token = req.headers['authorization'];
  getUserId(token).then((userId) => {
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
    con.query(sql,
      ['group_member_info', 'group_info', userId, groupId, 'group_member_info', userId, 'group_info', groupId],
      function (err, results) {
      if (err) {
        console.log(err);
        return res.status(500).send({
          errorMessage: err.sqlMessage
        });
      }
      if (results[0].length > 0) {
        const {
          join_status,
          group_status
        } = results[0][0];
        const sqlUpdate1 = group_status === 1 ?
          `update ?? set join_status = 2 where member_id = ? and group_id = ?;select join_status from ?? where member_id = ? and group_id = ?;` :
          `update ?? set join_status = 1 where member_id = ? and group_id = ?;select join_status from ?? where member_id = ? and group_id = ?;`;
        const sqlDelete1 =
          'delete from  ?? where member_id = ? and group_id = ?;';
        if (actionType === 2) {
          con.query(sqlDelete1,
            ['group_member_info', userId, groupId, 'group_member_info', userId, groupId],
            function (err, rows) {
            if (err) {
              console.log(err);
              return res.status(500).send({
                errorMessage: err.sqlMessage
              });
            }
            if (rows.affectedRows > 0) {
              res.json({
                resultCode: 200,
                rtnMsg: 'Leave Group success'
              });
            } else {
              res.status(400).json({
                resultCode: 400,
                rtnMsg: 'Leave Group fail, group is not exist.'
              });
            }
          });
        } else {
          if (join_status === 1) {
            con.query(sqlUpdate1, ['group_member_info', userId, groupId,  'group_member_info', userId, groupId], function (err, rows) {
              if (err) {
                console.log(err);
                return res.status(500).send({
                  errorMessage: err.sqlMessage
                });
              }
              const joinStatus = rows[1][0].join_status;
              if (rows[0].affectedRows === 0) {
                res.status(400).json({
                  joinStatus,
                  resultCode: 400,
                  rtnMsg: 'already send joinning request'
                });
              } else {
                res.json({
                  joinStatus,
                  resultCode: 200,
                  rtnMsg: 'Join Group success'
                });
              }
            });
          } else if (join_status === 2) {
            res.status(400).json({
              resultCode: 400,
              rtnMsg: 'already in the group'
            });
          } else {
            res.status(400).json({
              resultCode: 400,
              rtnMsg: 'need to send request again.'
            });
          }
        }
      } else {
        const {
          access_right,
          member_name
        } = results[1][0];
        const { group_status } = results[2][0];
        const sqlUpdate2 = group_status === 1 ?
          `insert into  ??  values(?, ?, ?, ?, 2, ?);select join_status from ?? where member_id = ? and group_id = ?` :
          `insert into  ??  values(?, ?, ?, ?, 1, ?);select join_status from ?? where member_id = ? and group_id = ?`;
        con.query(sqlUpdate2,
          ['group_member_info', groupId, access_right, userId,
          member_name, moment().format('YYYY-MM-DD HH:mm:ss'),
          'group_member_info', userId, groupId],
          function (err, rows) {
            if (err) {
              console.log(err);
              return res.status(500).send({
                errorMessage: err.sqlMessage
              });
            }
            const joinStatus = rows[1][0].join_status;
            if (rows[0].affectedRows > 0) {
              if (group_status === 1) {
                res.json({
                  joinStatus,
                  resultCode: 200,
                  rtnMsg: 'Join Group success.'
                });
              } else {
                res.json({
                  joinStatus,
                  resultCode: 200,
                  rtnMsg: 'send enter group request success.'
                });
              }
            } else {
              res.status(400).json({
                joinStatus,
                resultCode: 400,
                rtnMsg: 'send enter group request fail.'
              });
            }
        });
      }
    });
  }, err => res.status(400).json({ rtnMsg: 'token is invalid'}));

});

router.post('/getGroupMemberList', function (req, res, next) {
  const {
    con,
    body: {
      groupId,
      infoType
    }
  } = req;
  const token = req.headers['authorization'];
  getUserId(token).then((userId) => {
    if (infoType === 2 || infoType === 3) {
      const memberSql = infoType === 2 ? `
        select m.group_id, m.access_right, m.member_id, m.member_name,
        m.join_status, u.icon_small
        from ?? m, ?? u
        where
        group_id = ? and access_right >= 30 and access_right <= 60
        and u.user_id = m.member_id;
      `
      :
      `select m.group_id, m.access_right, m.member_id, m.member_name, m.join_status, u.icon_small
      from ?? m, ?? u
      where group_id = ?
      and u.user_id = m.member_id;
      `
      ;
      con.query(memberSql, ['group_member_info', 'user_profile', groupId], function (err, rows) {
        if (err) {
          console.log(err);
          return res.status(500).send({
            errorMessage: err.sqlMessage
          });
        }

        const groupMemberInfo = rows.map(_row => {
          const {
            group_id,
            access_right,
            member_id,
            member_name,
            join_status,
            icon_small
          } = _row;
          return {
            groupId: group_id,
            accessRight: access_right,
            memberId: member_id,
            memberName: member_name,
            joinStatus: join_status,
            userIcon: icon_small
          };
        });
        if (rows.length > 0) {
          res.json({
            info: {
              groupMemberInfo,
              subGroupInfo: {},
              totalCounts: 0,
              rtnMsg: 'Get group member list success.'
            },
            resultCode: 200
          });
        } else {
          res.status(400).json({
            rtnMsg: 'Get group member list fail.'
          })
        }
      });
    } else {
      const subGroupSql = `
        select group_id, group_name , group_status, group_icon
        from ??
        where left(group_id, 5) = ?;
      `;
      const brandId = groupId.slice(0, 5);
      con.query(subGroupSql, ['group_info', brandId], function (err, _results) {
        if (err) {
          console.log(err);
          return res.status(500).send({
            errorMessage: err.sqlMessage
          });
        }
        if (_results.length > 0) {
          const brands = _results.filter(_re => {
            const arr = _re.group_id.split('-');
            if (arr[3] === '0') {
              return _re;
            }
          });
          const branches = _results.filter(_re => {
            const arr = _re.group_id.split('-');
            if (arr[3] > '0' && arr[4] === '0') {
              return _re;
            }
          });
          const coaches = _results.filter(_re => {
            const arr = _re.group_id.split('-');
            if (arr[3] >= '0' && arr[4] > '0' && arr[5] === '0') {
              return _re;
            }
          });
          const subGroupInfo = {
            brands,
            branches,
            coaches
          }
          res.json({
            info: {
              totalCounts: 0,
              rtnMsg: 'Get group member list success.',
              groupMemberInfo: [],
              subGroupInfo
            },
            resultCode: 200
          });
        }
      });
    }


  });

});
// Exports
module.exports = router;
