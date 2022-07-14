const ejs = require('ejs');
var nodemailer = require('nodemailer');
var constants = require('../lib/constant');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: constants.email,
      pass: constants.password
    }
  });
module.exports.send_email = async function(subject,htmlFile,recipient,body){
    var mailOptions = {
        from: 'Connected GOC',
        to: recipient,
        subject: subject,
        text: 'That was easy!',
        html: await ejs.renderFile(htmlFile,body)
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}