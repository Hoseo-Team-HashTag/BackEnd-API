const crypto = require("crypto")

require("dotenv").config();

function hash(password) { // HMAC SHA256으로 비밀번호를 비밀키와 함께 해싱 후 값 리턴
    return crypto.createHmac('sha256',process.env.SECRET_KEY).update(password).digest('hex')
}

module.exports = hash;