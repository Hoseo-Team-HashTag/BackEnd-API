const mysql = require("../func/mysql.js")
const jwt = require("jsonwebtoken")
//(0->문제없음 / 1-> 토큰에 이상이있음(유효기간 만료 혹은 올바르지 않은 토큰)
const authJWT = (req,res,next) => {
    try {
        const userToken = req.body.accessToken;
        const userData = jwt.verify(userToken,process.env.ACCESS_SECRET);
        mysql.pool.getConnection((err, conn)=> {
            if(err) {
                conn.release();
                console.log('Mysql getConnection error. aborted');
                return res.status(500).json({ 
                    tokenResult : 1
                });
            }
            conn.query("SELECT * FROM accounts WHERE userEmail = ?",[userData.email],(err,result) =>{
                conn.release();
                if(err || !result) {
                    console.log("---- [loginSuccess.1] User Data Error ----\n" + err + "\n--------------------");
                    console.log("---- [loginSuccess.1] User Data Error ----\n" + result + "\n--------------------");
                    return res.status(500).json({
                        tokenResult : 1
                    });                    
                }
                req.userEmail = result[0].userEmail;
                req.userName = result[0].userName;
                next();
            });
    });
    } catch(error) {
        return res.status(500).json(error);
    }
};

module.exports = authJWT;