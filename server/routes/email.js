const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const getTargetInfo = require('../models/user_id').getTargetInfo;

const EVENT_MAIL_ADDRESS = 'event_service@alatech.com.tw';
const eventTransporter = nodemailer.createTransport({
  host: 'exchange.alatechtw.com',
  secureConnecton: true,
  port: 25,
  auth: {
    user: 'event_service',
    pass: 'Alatech8@@5'
  }

});

/**
 * 官方活動頁面-聯絡我們
 * 將使用者輸入內容透過email寄送
 */
router.post('/official-contactus', function (req, res, next) {
  const {
    errorMsg,
    subject,
    text
  } = checkContent(req);

  if (errorMsg) {
    return res.json({
      resultCode: 400,
      resultMessage: errorMsg,
      apiCode: 'N7001'
    });

  }

  const eventMailOptions = {
    from: EVENT_MAIL_ADDRESS,
    to: EVENT_MAIL_ADDRESS,
    subject,
    text
  };

  eventTransporter.sendMail(eventMailOptions, function(error, info){
    if (error) {
      return res.json({
        resultCode: 400,
        resultMessage: "Send message failed.",
        apiCode: 'N7001'
      });

    } else {

      return res.json({
        resultCode: 200,
        resultMessage: "Send message success.",
        apiCode: 'N7001'
      });

    }

  });

});

/**
 * 透過email寄送申請或取消申請退賽通知信件給管理者
 */
router.post('/leave-event', function (req, res, next) {
  const { body } = req;
  const { token } = body;
  if (!token) {
    return res.json({
      resultCode: 400,
      resultMessage: "Need token.",
      apiCode: 'N7002'
    });

  } else {
    const sql = `select user_id as userId, login_acc as nickname from ?? where access_token = ?`;
    const algebra = ['user_profile', token];
    const result = getTargetInfo(sql, algebra)
    .then(response => {
      const { nickname, userId } = response[0];
      const info = {...body, nickname, userId};
      const { subject, text } = getLeaveMailContent(req, info);
      sendLeaveMail(subject, text)
        .then(emailResult => {
          return res.json({
            apiCode: 'N7002',
            resultCode: 200,
            resultMessage: 'Update success.'
          });
        }).catch(emailError => {
          return res.json({
            resultCode: 400,
            resultMessage: emailError,
            apiCode: 'N7002'
          });
        });
      
    })
    .catch(error => {
      return res.json({
        apiCode: 'N7002',
        resultCode: 400,
        resultMessage: error
      });

    });

  }

});

/**
 * 確認內容，若內容符合格式則回傳信件標題與內容
 * @param {any} req 請求內容
 * @author kidin-1101213
 */
function checkContent(req) {
  const result = {
    errorMsg: null,
    subject: null,
    text: null
  };

  const { body } = req;
  const { contentType, name, email, phone, content } = body;
  const formTest = {
    email: /^\S{1,63}@[a-zA-Z0-9]{2,63}.[a-zA-Z]{2,63}(.[a-zA-Z]{2,63})?$/,
    phone: /^([+0-9\s]*)$/
  };

  const maxLength = {
    name: 24,
    email: 50,
    phone: 20,
    content: 500
  };

  for (let _key in body) {
    const value = `${body[_key]}`;
    const valueLength = value.length;
    if (valueLength === 0) {
      result.errorMsg = `Empty:${_key}`;
    } else if (valueLength > maxLength[_key]) {
      result.errorMsg = `Too long:${_key}`;
    } else if (formTest[_key] && !formTest[_key].test(value)) {
      result.errorMsg = `Format error:${_key}`;
    }

  }

  const prefix = getSubjectPrefix(req);
  if (!result.errorMsg) {
    result.subject = `${prefix}[官方活動]${getContentType(contentType)}-${name}`;
    result.text = `
      名稱：${name}\n
      e-mail：${email}\n
      電話：${phone}\n
      內容：\n${content}\n
    `;

  }

  return result;
}

/**
 * 將內容類別代號轉為對應詞彙
 * @param {number} type 內容類別
 * @returns {string} 對應類別詞彙
 * @author kidin-1101213
 */
function getContentType(type) {
  switch (type) {
    case 1:
      return '操作問題';
    case 2:
      return '付款問題';
    case 3:
      return '意見';
    case 4:
      return '其他';
  }

}

/**
 * 確認環境，區分是否為測試信件
 * @param {*} req -api 請求
 */
function getSubjectPrefix(req) {
  const host = req.get('host');
  const notProduction = !host.includes('www.gptfit.com');
  return notProduction ? '(測試)' : '';
}

/**
 * 取得信件標題與內容
 * @param {*} req -api 請求
 * @param {*} info -使用者資訊
 */
function getLeaveMailContent(req, info) {
  const { applyStatus, eventId, eventName, userId, nickname, reason } = info;
  const prefix = getSubjectPrefix(req);
  const result = { 
    // applyStatus詳見api 6015 userProfile.applyStatus
    subject: `${prefix}${applyStatus === 3 ? '【退賽申請】通知' : '【取消退賽】通知'}`,
    text: `
      活動編號：${eventId}
      活動名稱：${eventName}
      使用者編號：${userId}
      暱稱：${nickname}\n
      原因：\n${reason}\n
    `
   };

   return result;
}

/**
 * 寄送email
 * @param {string} subject -信件標題
 * @param {string} text -信件內容
 */
function sendLeaveMail(subject, text) {
  const mailOptions = {
    from: EVENT_MAIL_ADDRESS,
    to: EVENT_MAIL_ADDRESS,
    subject,
    text
  };

  return eventTransporter.sendMail(mailOptions);
}

// Exports
module.exports = router;