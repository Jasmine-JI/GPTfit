var express = require('express');
var router = express.Router();
var getGroupNameList = require('../models/exist_innerAdmin').getGroupNameList;

// groupId[]查找群組名稱-kidin-1090923
router.post('/getGroupNameList', function (req, res, next) {
  const {
    con,
    body
  } = req;

  const result = getGroupNameList(body.groupIdList).then(resp => {
    if (resp) {
      const resList = [];
      body.groupIdList.forEach(_list => {
        resp.forEach(__resp => {
          if (_list === __resp.groupId) {
            resList.push(__resp);
          }

        });

      });

      return res.json({
        apiCode: 'N9002', // 暫定
        resultCode: 200,
        resultMessage: "Get result success.",
        nickname: result
      });

    } else {
      return res.json({
        apiCode: 'N9002', // 暫定
        resultCode: 400,
        resultMessage: "Get result failed.",
      })

    }

  });

});

// Exports
module.exports = router;
