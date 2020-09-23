var { getUserActivityInfo } = require('../models/officialActivity_model');
var { checkAccessRight } = require('../models/auth.model');
var { getUserId } = require('../models/user_id');
var formidable = require('formidable');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const moment = require('moment');


// 建立活動檔案
router.post('/create', (req, res, next) => {
  const {
    con,
    body
  } = req;

  const dir = `/tmp/official-activity`;
  checkDir(dir);

  fs.writeFile(`/tmp/official-activity/${body.file.fileName}.json`, JSON.stringify(body.file), (err) => {
    if (err) {
      console.error(err);
      writeLogFile(body.file.fileName, body.token, 'Create official activity', err);
      return res.json({
        resultCode: 400,
        resultMessage: "Create activity failed.",
        nodejsApiCode: "N3001"
      })

    } else {
      writeLogFile(body.file.fileName, body.token, 'Create official activity', 'Create official activity success.');
      return res.json({
        resultCode: 200,
        resultMessage: "Create activity success.",
        nodejsApiCode: "N3001",
        fileName: body.file.fileName
      });

    }

  })

});

// 取得指定活動檔案
router.post('/get', (req, res, next) => {
  const {
    con,
    body
  } = req;

  fs.readFile(`/tmp/official-activity/${body.fileName}.json`, (err, data) => {
    if (err) {
      return res.json({
        resultCode: 400,
        resultMessage: "No such file.",
        nodejsApiCode: "N3002"
      })

    } else {
      return res.json({
        resultCode: 200,
        resultMessage: "Get file success.",
        nodejsApiCode: "N3002",
        activity: JSON.parse(data.toString('utf8'))
      });

    }

  })

});

// 更新指定活動檔案
router.post('/update', (req, res, next) => {
  const {
    con,
    body
  } = req;

  fs.writeFile(`/tmp/official-activity/${body.file.fileName}.json`, JSON.stringify(body.file), (err) => {
    if (err) {
      writeLogFile(body.file.fileName, body.token, 'Update official activity', err);
      return res.json({
        resultCode: 400,
        resultMessage: "Update activity failed.",
        nodejsApiCode: "N3003"
      })

    } else {
      writeLogFile(body.file.fileName, body.token, 'Update official activity', 'Update official activity success.');
      return res.json({
        resultCode: 200,
        resultMessage: "Update activity success.",
        nodejsApiCode: "N3003",
        fileName: body.file.fileName
      });

    }

  })

});

// 更新指定活動檔案
router.post('/edit', (req, res, next) => {
  const {
    con,
    body
  } = req;

  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, imgs) => {
    const token = fields.token,
          file = fields.file,
          fileName = JSON.parse(file).fileName;

    saveImg(fileName, imgs);

    fs.writeFile(`/tmp/official-activity/${fileName}.json`, file, (err) => {
      if (err) {
        writeLogFile(fileName, token, 'Edit official activity', err);
        return res.json({
          resultCode: 400,
          resultMessage: "Update activity failed.",
          nodejsApiCode: "N3007"
        })

      } else {
        writeLogFile(fileName, token, 'Edit official activity', 'Edit official activity success.');
        return res.json({
          resultCode: 200,
          resultMessage: "Update activity success.",
          nodejsApiCode: "N3007",
          fileName: fileName
        });

      }

    })

  });

});

// 更新指定活動檔案報名人員
router.post('/apply', (req, res, next) => {
  const {
    con,
    body
  } = req;

  let data = fs.readFileSync(`/tmp/official-activity/${body.fileName}.json`);
  data = JSON.parse(data.toString('utf8'));

  data.group[body.groupIdx].member.push(body.memberInfo);

  fs.writeFile(`/tmp/official-activity/${body.fileName}.json`, JSON.stringify(data), (err) => {
    if (err) {
      writeLogFile(body.fileName, body.token, 'Apply official activity', err);
      return res.json({
        resultCode: 400,
        resultMessage: "Apply activity failed.",
        nodejsApiCode: "N3008"
      })

    } else {
      writeLogFile(body.fileName, body.token, 'Apply official activity', 'Apply official activity success.');
      return res.json({
        resultCode: 200,
        resultMessage: "Apply activity success.",
        nodejsApiCode: "N3008",
        fileName: body.fileName
      });

    }

  })

});

// 取得所有活動檔案列表
router.post('/get-all', (req, res, next) => {
  const {
    con,
    body
  } = req;


  checkAccessRight(body.token, 29).then(result => {

    fs.readdir('/tmp/official-activity', (err, files) => {
      if (err) {
        return res.json({
          resultCode: 400,
          resultMessage: "Get all activity failed.",
          nodejsApiCode: "N3004"
        })

      } else {
        let list = [];

        files.forEach((_file, index) => {
          try {
            let data = fs.readFileSync(`/tmp/official-activity/${_file}`),
                file = JSON.parse(data.toString('utf8'));

            if (file.eventStatus === 'public' || result) {

              list.push({
                fileName: file.fileName,
                name: file.name,
                mapId: file.mapId,
                startTimeStamp: file.startTimeStamp,
                finalTimeStamp: file.endTimeStamp,
                eventStatus: file.eventStatus
              })

            }

          } catch (err) {
            console.log(err);
          }

        })

        res.json({
          resultCode: 200,
          resultMessage: "Get all activity success.",
          nodejsApiCode: "N3004",
          activityList: list
        })

      }

    })

  })

});

// 更新指定活動檔案排名
router.post('/update-rank', (req, res, next) => {
  const {
    con,
    body
  } = req;

  checkAccessRight(body.token, 29).then(result => {
    if (result) {
      let newData,
          data;

      try {
        data = fs.readFileSync(`/tmp/official-activity/${body.fileName}.json`);
      } catch (err) {
        console.log(`Error: Read file ${body.fileName} failed.`);
        writeLogFile(body.fileName, body.token, 'Before update Ranking', err);

        return res.json({
          resultCode: 400,
          resultMessage: "Update ranking failed.",
          nodejsApiCode: "N3005"
        })
      }

      let file = JSON.parse(data.toString('utf8'));
      getPerGroupRank(body, res, file);
    } else {
      return res.json({
        resultCode: 403,
        resultMessage: "Haven't access right.",
        nodejsApiCode: "N3005"
      })

    }

  })

});

// 取得指定使用者歷史活動紀錄
router.post('/user-record', (req, res, next) => {
  const {
    con,
    body
  } = req;

  checkAccessRight(body.token, 29).then(result => {
    fs.readdir('/tmp/official-activity', (err, files) => {
      if (err) {
        return res.json({
          resultCode: 400,
          resultMessage: "Get all activity failed.",
          nodejsApiCode: "N3006"
        })

      } else {
        let list = [];
        files.forEach(fileName => {
          let data = fs.readFileSync(`/tmp/official-activity/${fileName}`);
          data = JSON.parse(data.toString('utf8'));

          if (data.eventStatus === 'public' || result) {
            data.group.forEach(_group => {
              let idx;
              if (_group.member.some((_member, index) => {
                if (_member.userId === body.userId) {
                  idx = index;
                  return _member.userId === body.userId
                }

              })) {

                let rankIdx;
                if (_group.rank.some((_rank, rIndex) => {
                  if (_rank.userId === body.userId) {
                    rankIdx = rIndex;
                    return _rank.userId === body.userId && _group.rank[rankIdx].ranking !== '-';
                  }

                })) {
                  list.push({
                    fileName: fileName.split('.')[0],
                    name: data.name,
                    mapId: data.mapId,
                    startTimeStamp: data.startTimeStamp,
                    finalTimeStamp: data.endTimeStamp,
                    groupName: _group.groupName,
                    rank: `${_group.rank[rankIdx].ranking}/${_group.rank.length}`,
                    grades: _group.rank[rankIdx].record,
                    userStatus: 'finish'
                  })

                } else {
                  list.push({
                    fileName: fileName.split('.')[0],
                    name: data.name,
                    mapId: data.mapId,
                    startTimeStamp: data.startTimeStamp,
                    finalTimeStamp: data.endTimeStamp,
                    groupName: _group.groupName,
                    rank: `-/${_group.rank.length}`,
                    grades: '-:--:--',
                    userStatus: _group.member[idx].status
                  })

                }

              }

            });

          }




        })

        list.sort((a, b) => b.finalTimeStamp - a.finalTimeStamp);

        return res.json({
          resultCode: 200,
          resultMessage: "Get all activity success.",
          nodejsApiCode: "N3006",
          fileName: list
        });

      }

    })

  })

});

/**
 * 將參賽者成績篩選掉相同user id的排名，並確認是否有成績相同的情況
 * @param data
 * @author kidin-1090902
 */
function filterData(data) {
  const rankList = [];
  let rank = 1,
      preRecord = null;

  data.forEach(_data => {
    if (!rankList.some(_list => _list.userId === _data.user_id)) {

      // 完賽時間相同則排名相同
      if (preRecord !== null && _data.total_second === preRecord) {
        rankList.push({
          ranking: rank - 1,
          userId: _data.user_id,
          nickname: _data.login_acc,
          record: formatTime(_data.total_second),
          finishDate: formatDate(+_data.creation_unix_timestamp),
          distance: _data.total_distance_meters
        });

      } else {
        preRecord = _data.total_second;

        rankList.push({
          ranking: rank,
          userId: _data.user_id,
          nickname: _data.login_acc,
          record: formatTime(_data.total_second),
          finishDate: formatDate(+_data.creation_unix_timestamp),
          distance: _data.total_distance_meters
        });

      }

      rank++;
    }

  });

  return rankList;
}

/**
 * 將秒轉換成時分秒
 * @param time
 * @author kidin-1090902
 */
function formatTime(time) {
  const hour = Math.floor((time) / 3600);
  const minute = Math.floor((time % 3600) / 60);
  const second = time - (hour * 3600) - (minute * 60);
  if (hour === 0) {
    return `${fillTwoDigits(minute)}:${fillTwoDigits(second)}`;
  } else {
    return `${hour}:${fillTwoDigits(minute)}:${fillTwoDigits(second)}`;
  }
}

/**
 * 時間補零
 * @param num
 * @author kidin-1090902
 */
function fillTwoDigits(num) {
  const timeStr = '0' + Math.floor(num);
  return timeStr.substr(-2);
}

/**
 * 將timestamp轉為日期
 * @param timestamp
 * @author kidin-1090902
 */
function formatDate(timestamp) {
  return moment(timestamp).format('YYYY-MM-DD');
}

/**
 * 取得各群組排名並寫入檔案
 * @param file
 * @returns file
 * @author kidin-1090911
 */
async function getPerGroupRank(body, res, file) {
  const mapId = file.mapId,
        startTimeStamp = file.startTimeStamp,
        endTimeStamp = file.endTimeStamp,
        mapDistance = file.mapDistance;

  for (let i = 0; i < file.group.length; i++) {
    let userIdArr = [];

    file.group[i].member.forEach(_member => {
      if (_member.status === 'checked') {
        userIdArr.push(_member.userId);
      }

    });

    if (userIdArr.length !== 0) {

      const query = await getUserActivityInfo(mapId.toString(), startTimeStamp, endTimeStamp, mapDistance, userIdArr).then(resp => {
        if (resp) {
          file.group[i].rank = filterData(resp);
        } else {
          writeLogFile(body.fileName, body.token, 'Query db for sports file', err);
          file.group[i].rank = [];
        }

      })

    }

  }

  file = fillRanking(file);

  fs.writeFile(`/tmp/official-activity/${body.fileName}.json`, JSON.stringify(file), (err) => {
    if (err) {
      console.log(`Error: Write file ${body.fileName} failed.`);
      writeLogFile(body.fileName, body.token, 'Update ranking', err);

      return res.json({
        resultCode: 400,
        resultMessage: "Update ranking failed.",
        nodejsApiCode: "N3005"
      })

    } else {
      writeLogFile(body.fileName, body.token, 'Update ranking', 'Update ranking success.');
      return res.json({
        resultCode: 200,
        resultMessage: "Update ranking success.",
        nodejsApiCode: "N3005",
        fileName: body.fileName
      });

    }

  })

}

/**
 * 將已報名但未上傳成績的參賽者加入排名末端
 * @param file
 * @author kidin-1090911
 */
function fillRanking(file) {
  file.group.map(_group => {
    const notFinishUser = _group.member.filter(_member => !_group.rank.some(_rank => _rank.userId === _member.userId)),
          rankLength = _group.rank.length;

    notFinishUser.forEach(_user => {
      _group.rank.push({
        ranking: '-',
        userId: _user.userId,
        nickname: _user.nickname,
        record: 'N/A',
        finishDate: 'N/A',
        distance: 'N/A'
      });

    });

    return _group;
  });

  return file;
}

/**
 * 儲存照片至指定資料夾
 * @param {string} fileName
 * @param {any} imgs
 * @author kidin-1090914
 */
function saveImg(fileName, imgs) {
  const imgDir = '/tmp/official-activity-img',
        imgChildDir = `/tmp/official-activity-img/${fileName}`;
  checkDir(imgDir);
  checkDir(imgChildDir);

  for (let img in imgs) {

    if (imgs.hasOwnProperty(img)) {
      const oldPath = imgs[img].path,
            newPath = `${imgChildDir}/${imgs[img].name}`
      fs.renameSync(oldPath, newPath);
    }

  }

}

/**
 * 判斷目標資料夾是否存在，如不存在則創建該資料夾
 * @param {string} path
 * @param {*} cb
 * @author kidin-1090914
 */
function checkDir(path, cb) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }

}

/**
 * 將錯誤訊息寫入log檔
 * @param {string} fileName-該活動檔案名稱
 * @param {string} token
 * @param {string} action-正在執行的動作
 * @param {string} msg-訊息
 * @author kidin-1090918
 */
async function writeLogFile(fileName, token, action, msg) {

  const dir = '/tmp/official-activity-log',
        logFile = `${dir}/${fileName}.log`;
  checkDir(dir);

  let data = [];
  try {
    if (fs.existsSync(logFile)) {

      data = fs.readFileSync(logFile);

      data = JSON.parse(data.toString('utf8'));
    }

  } catch(err) {

    console.error(err);
  }

  // 保留500條log
  if (data.length === 500) {

    data.pop();
  }

  let userId;
  const query = await getUserId(token).then(resp => {

    if (resp) {

      userId = resp;
    } else {

      userId = null;
    }

  })

  data.unshift({
    logDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    operatorId: userId,
    action: action,
    msg: msg
  });

  const write = fs.writeFileSync(logFile, JSON.stringify(data));
}

module.exports = router;
