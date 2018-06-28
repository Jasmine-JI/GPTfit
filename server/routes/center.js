var express = require('express');

var router = express.Router();
var { getUserId } = require('../models/user_id');
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
        console.log(rows);

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
        console.log(_results);
        if (_results.length > 0) {
          const brands = _results.filter(_re => {
            const arr = _re.group_id.split('-');
            console.log('arr: ', arr);
            if (arr[3] === '0') {
              console.log('_re', _re);
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
          console.log('brands: ', brands);
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
