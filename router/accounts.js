const express = require("express")
const router = express.Router()
const crypto = require("crypto")

const mysql = require("../func/mysql/mysql.js")

require("dotenv").config();

function hash(password) { // HMAC SHA256으로 비밀번호를 비밀키와 함께 해싱 후 값 리턴
    return crypto.createHmac('sha256',process.env.SECRET_KEY).update(password).digest('hex')
}

router.post('/signUp', (req, res) => { //회원가입 POST (요청)
    const userEmail = req.body.userEmail;
    const userPW = req.body.userPW;
    const userName = req.body.userName;

    mysql.pool.getConnection((err, conn)=> {
        if(err) {
            conn.release();
            console.log('Mysql getConnection error. aborted');
            //res.end();
            return res.status(200).json({ // 200 말고 다른 값도 사용해야하는지
                signUpResult : -1
            })
        }

        conn.query("SELECT COUNT(*) AS count FROM accounts WHERE userEmail = ?",[userEmail],(err,result)=>{
            conn.release();
            if(err) {
                console.log("---- [1]ID판단 SQL문 작동중 에러 발생 ----");
                console.log(err);
                console.log("--------------------");
                return res.status(200).json({
                    signUpResult : -1
                });
            }
            if(result[0].count == 1) {
                console.log("회원가입 실패. (중복된 이메일)")
                return res.status(200).json({
                    signUpResult : 1
                });
            } else {
                const hashUserPW = hash(userPW); 
                const exec = conn.query('insert into accounts (userEmail, userPW, userName) values (?,?,?);',
                    [userEmail, hashUserPW, userName],
                    (err, result)=>{
                        conn.release();
                        console.log('실행된 SQL: ' + exec.sql);
                        if(err){
                            console.log("---- [2]계정 생성중 SQL문 작동 에러 발생 ----");
                            console.log(err);
                            console.log("--------------------");
                            return res.status(200).json({
                                signUpResult : -1
                            });
                        }
                        if (result) {
                            console.log('Email : '+userEmail+" 계정 생성완료.");
                            return res.status(200).json({
                                signUpResult : 0
                            });
                        }else{
                            console.log('---- [3]계정 생성중 SQL문 작동 에러 발생 ----');
                            return res.status(200).json({
                                signUpResult : -1
                            });
                        }
                    })
            }
        })
    })
})




router.post('/', (req, res) => {
    console.log("Accounts.js 접근 Data : " + req.body.content + "/" + req.body.d);
    return res.status(200).json({
        msg : "테스트",
        data1 : req.body.content
    })
})

router.post('/hello',(req,res)=> {
    console.log("Hello")
})

module.exports = router;