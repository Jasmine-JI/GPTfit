const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

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
  
  const transporter = nodemailer.createTransport({
    host: 'exchange.alatechtw.com',
    secureConnecton: true,
    port: 25,
    auth: {
      user: 'event_service',
      pass: 'Alatech8@@5'
    }

  });

  const mailOptions = {
    from: 'event_service@alatech.com.tw',
    to: 'event_service@alatech.com.tw',
    subject,
    text
  };

  transporter.sendMail(mailOptions, function(error, info){
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

  const host = req.get('host');
  const notProduction = !host.includes('www.gptfit.com');
  const prefix = notProduction ? '(測試)' : '';
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


// Exports
module.exports = router;