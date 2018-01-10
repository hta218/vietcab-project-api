const fs = require('fs');

const moment = require('moment');
const mtz = require('moment-timezone');
const nodemailer = require("nodemailer");

const createTransport = (adminInfos) => {
  var smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
          user: adminInfos.email,
          pass: adminInfos.password
      }
  });
  return smtpTransport;
};

const sendMail = (adminInfos, toAddress, subject, htmlContent, callback) => {
  var mailOptions = {
    from: "Việt Cab Team",
    to: toAddress,
    subject: subject,
    html: htmlContent
  };

  // NOTE: Be sure to allow less sercure apps to access your account (gmail), so u able to send mail via your gmail
  // More infos: https://support.google.com/accounts/answer/6010255?hl=en
  // Allow: https://myaccount.google.com/lesssecureapps

  const tranporter = createTransport(adminInfos);
  tranporter.sendMail(mailOptions, callback);
};

exports.send = (adminInfos, driver, callback) => {
  var path = './views/mail-body.html';

  fs.readFile(path, 'utf-8', (err, htmlContent) => {
    if (err) {
      console.log( "Unable to read mail-body");
    }
    else {
      htmlContent = htmlContent.replace('DRIVER_NAME', driver.name)
      sendMail(adminInfos, driver.email, 'Việt Cab Team', htmlContent, callback);
    }
  });
};
