var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: 'exchange.alatechtw.com',
  secureConnecton: true,
  port: 25,
  auth: {
    user: 'noreply',
    pass: 'A1atech',
  },
});

// var mailOptions = {
//   from: 'noreply@alatech.com.tw',
//   to: '',
//   subject: 'Sending Email using Node.js',
//   text: 'That was easy!',
// };
function sendMail(mailOptions) {
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = {
  sendMail,
};
