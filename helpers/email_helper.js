const ejs = require('ejs');
var nodemailer = require('nodemailer');
var constants = require('../lib/constant');

var transporter = nodemailer.createTransport({
    // service: 'gmail',
    // auth: {
    //   user: constants.email,
    //   pass: constants.password
    // }
    host: "smtp.ionos.com",
    port: 587,
    tls: true,
    auth: {
      user: constants.email,
      pass: constants.password,
    }
  });
module.exports.send_email = async function(subject,htmlFile,recipient,body){
    var mailOptions = {
        from: constants.email,
        to: recipient,
        subject: subject,
        text: 'That was easy!',
        html: await ejs.renderFile(htmlFile,body)
      };
      console.log(constants.email,constants.password)
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('email sent')
          return 1;
        }
      });
}

exports.testEmail = async (req, res) => {
    try {
        const transporterTest = nodemailer.createTransport({
            host: "smtp.ionos.com",
            port: 587,
            tls: true,
            auth: {
              user: 'support@park45.ca',
              pass: 'yA650707!',
            },
        });

        const mailOptions = {
            from: "support@park45.ca",
            to: 'qasim@bbits.solutions',
            subject: "Ventra Support",
            text: 'Hello Ahsan Ayoub',
        };

        const info = await transporterTest.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (err) {
        console.log('Email is not valid:', err);
    }
}