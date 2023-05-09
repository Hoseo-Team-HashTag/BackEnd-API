const nodemailer = require("nodemailer");

require("dotenv").config();

const smtpTransport = nodemailer.createTransport({
    service: "Naver",
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PW

    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports={
    smtpTransport
}