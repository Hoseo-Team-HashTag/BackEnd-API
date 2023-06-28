const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")

const mysql = require("../func/mysql.js");
const authJWT = require("../func/auth.js");
require("dotenv").config();
router.post('/refreshToken',(req,res)=>{
    try {
        const userToken = req.body.refreshToken;
        const userData = jwt.verify(userToken,process.env.REFRESH_SECRET);
        mysql.pool.getConnection((err, conn)=> {
            if(err) {
                conn.release();
                console.log('Mysql getConnection error. aborted');
                return res.status(200).json({ 
                    refreshTokenResult : 1
                });
            }
            conn.query("SELECT userEmail FROM accounts WHERE userEmail = ?",[userData.email],(err,result) =>{
                conn.release();
                if(err || !result) {
                    console.log("---- [refreshToken.1] User Data Error ----\n" + err + "\n--------------------");
                    console.log("---- [refreshToken.1] User Data Error ----\n" + result + "\n--------------------");
                    return res.status(200).json({
                        refreshTokenResult : 1
                    });                    
                }
                const accessToken = jwt.sign({
                    email : userEmail
                }, process.env.ACCESS_SECRET, {
                    expiresIn : '5m',
                    issuer : 'HappyTime'
                });
                console.log("Reissued successfully.");
                return res.status(200).json({
                    refreshTokenResult : 0,
                    accessToken : accessToken,
                })
            });
        });
    } catch(error) {
        return res.status(500).json(error);
    }
});


router.post('/loginSuccess',authJWT,(req,res)=> {
    return res.status(200).json({
        tokenResult : 0,
    });
});

module.exports = router;