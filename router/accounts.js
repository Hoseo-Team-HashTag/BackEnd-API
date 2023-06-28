const express = require("express")
const router = express.Router()
const crypto = require("crypto")
const jwt = require("jsonwebtoken")

const {smtpTransport} = require("../config/email.js")
const mysql = require("../func/mysql.js")

require("dotenv").config();

function hash(password) { // HMAC SHA256으로 비밀번호를 비밀키와 함께 해싱 후 값 리턴(해시)
    return crypto.createHmac('sha256',process.env.SECRET_KEY).update(password).digest('hex');
}

function randomLink() { //비밀번호 초기화서 유저에게 별도의 token 생성 코드 (crypto로 대체가능)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    const num = Math.floor(Math.random()*11)+10;
    let result = '';
    for(let i = 0; i < num; i++) {
        result += characters.charAt(Math.floor(Math.random()*charactersLength));
    }
    return result;
}

// 회원가입 return 값
// -1 SQL 에러 , 0 회원가입 완료 , 1 중복된 이메일(회원가입 실패)
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
            });
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

// 로그인 return 값
// -1 SQL 에러 , 0 로그인 성공 , 1 로그인 실패 (비밀번호 틀림) , 2 로그인 실패 (존재하지 않는 이메일)
router.post('/login', (req, res) => { // 로그인 Login (요청)
    const userEmail = req.body.userEmail;
    const userPW = req.body.userPW;

    mysql.pool.getConnection((err, conn)=> {
        if(err) {
            conn.release();
            console.log('Mysql getConnection error. aborted');
            //res.end();
            return res.status(200).json({ // 200 말고 다른 값도 사용해야하는지
                signUpResult : -1
            });
        }

        conn.query("SELECT COUNT(*) AS count FROM accounts WHERE userEmail = ?",[userEmail],(err,result)=>{
            conn.release();
            if(err) {
                console.log("---- [로그인.1]ID판단 SQL문 작동중 에러 발생 ----");
                console.log(err);
                console.log("--------------------");
                return res.status(200).json({
                    loginResult : -1
                });
            }
            if(result[0].count == 0) {
                console.log("로그인 실패 (존재하지 않는 이메일)");
                return res.status(200).json({
                    loginResult : 2
                });
            } else {
                const hashUserPW = hash(userPW); 

                conn.query("SELECT userPW FROM accounts WHERE userEmail = ?",[userEmail],(err,result)=>{
                    conn.release();
                    if(err) {
                        console.log("---- [로그인.2]로그인중 SQL문 작동 에러 발생 ----");
                        console.log(err);
                        console.log("--------------------");
                        return res.status(200).json({
                            loginResult : -1
                        });
                    }

                    if(hashUserPW != result[0].userPW) {
                        console.log("로그인 실패 (비밀번호가 일치하지 않습니다.)");
                        return res.status(200).json({
                            loginResult : 1
                        });
                    } else {
                        const accessToken = jwt.sign({
                            email : userEmail
                        }, process.env.ACCESS_SECRET, {
                            expiresIn : '5m',
                            issuer : 'HappyTime'
                        });
                        
                        const refreshToken = jwt.sign({
                            email : userEmail
                        }, process.env.REFRESH_SECRET, {
                            expiresIn : '24h',
                            issuer : 'HappyTime'
                        });

                        console.log("로그인 성공! [Email : " + userEmail + "]");
                        return res.status(200).json({
                            loginResult : 0,
                            accessToken : accessToken,
                            refreshToken : refreshToken
                        });
                    }
                });
            }
        })
    })
});

// 비밀번호 찾기 리턴값
// 0->전송 성공, 1->존재하지 않는 이메일, -1->서버오류로 인한 전송실패
router.post('/pwsearch', (req,res) => { // 비밀번호 찾기 POST(비번, 암호, 찾기)
    const userEmail = req.body.userEmail;

    mysql.pool.getConnection((err, conn)=> {
        if(err) {
            conn.release();
            console.log('Mysql getConnection error. aborted');
            //res.end();
            return res.status(200).json({ // 200 말고 다른 값도 사용해야하는지
                emailSystemResult : -1
            });
        }

        conn.query("SELECT COUNT(*) AS count FROM accounts WHERE userEmail = ?",[userEmail],(err,result)=>{
            conn.release();
            if(err) {
                console.log("---- [비밀번호 찾기.1]ID판단 SQL문 작동중 에러 발생 ----");
                console.log(err);
                console.log("--------------------");
                return res.status(200).json({
                    emailSystemResult : -1
                });
            }
            if(result[0].count == 0) {
                console.log("이메일 전송 실패 (존재하지 않는 이메일)");
                return res.status(200).json({
                    emailSystemResult : 1
                });
            } else {
                const linkCode = randomLink();
                const link = "http://localhost:8000/NewPassword/" + linkCode;
                const userEmail = req.body.userEmail;
                const reqTime =  {
                    nowTime :new Date(),
                    msTime : Date.now()
                };
                const ttl = 300;
                let mailOptions = {
                    from : {
                        name : "HappyTime",
                        address : process.env.ADMIN_EMAIL
                    },
                    to : userEmail,
                    subject : "[HappyTime] 비밀번호 초기화 링크 관련 이메일 입니다.",
                    html : `<p>[HappyTime] 비밀번호 초기화 링크 관련 이메일 입니다.</p>
                    <p><br>비밀번호 초기화 요청 시간 : ${reqTime.nowTime}<br></p>
                    <p><br>사이트 접속 전 꼭 본인이 직접 비밀번호 초기화를 신청하였는지 확인 후 접속해주세요.</p>
                    <a href="${link}">비밀번호 초기화 링크 바로가기</a>`
                };

                smtpTransport.sendMail(mailOptions, (err,info) => {
                    if(err) {
                        console.log("---- 이메일 전송 실패 (SMTP 오류) ----");
                        console.log(err)
                        console.log("--------------------");
                        return res.status(200).json({
                            emailSystemResult : -1
                        });
                    } else {
                        conn.query("SELECT COUNT(*) AS count FROM searchpw WHERE userEmail = ?",[userEmail],(err,result)=>{
                            conn.release();
                            if(err) {
                                console.log("---- [비밀번호 찾기.2]ID판단 SQL문 작동중 에러 발생 ----");
                                console.log(err);
                                console.log("--------------------");
                                return res.status(200).json({
                                    emailSystemResult : -1
                                });
                            }
                            if(result[0].count == 1) {
                                console.log("TOKEN값을 지급받은 이력이 있어 해당 데이터 갱신합니다.")
                                conn.query("UPDATE searchpw SET Token=?,TTL=?,reqTime=? WHERE userEmail=?",[linkCode,ttl,reqTime.msTime,userEmail],(err,result)=>{
                                    conn.release();
                                    if(err || !result) {
                                        console.log("---- [비밀번호 찾기.3]searchPW 갱신 SQL문 작동중 에러 발생 ----");
                                        console.log(err);
                                        console.log("--------------------");
                                        return res.status(200).json({
                                            emailSystemResult : -1
                                        });
                                    }
                                });
                            } else {
                                conn.query('INSERT into searchpw (userEmail, Token, TTL, reqTime) values (?,?,?,?);',[userEmail, linkCode, ttl, reqTime.msTime],(err, result)=> {
                                    conn.release();
                                    if(err || !result) {
                                        console.log("---- [비밀번호 찾기.3]데이터 삽입 SQL문 작동중 에러 발생 ----");
                                        console.log(err);
                                        console.log("--------------------");
                                        return res.status(200).json({
                                            emailSystemResult : -1
                                        });
                                    }
                                });
                            }
                            console.log(Date.now());
                            console.log("[비밀번호 찾기 메일 전송완료] Email sent : " + info.response);
                            return res.status(200).json({
                                 emailSystemResult : 0
                            });
                        });
                    }
                });
            }
        });
    })
});

//비밀번호 최기화 리턴값
// 0-> 초기화 성공, 1-> 유효하지 않는 토큰, -1->서버오류로 인한 전송실패
router.post('/NewPassword/:userToken', (req,res) => {
    const { userToken } = req.params;
    const userNewPassword = req.body.userPW;
    let deleteData = 0; // MySQL Data Delete를 위한 변수로  1 = TTL 만료 / 0 = 성공적인 삭제
    console.log(Date.now());
    mysql.pool.getConnection((err,conn)=> {
        if(err) {
            conn.release();
            console.log("MySql get Connection error. aborted");
            return res.status(200).json({
               resetResult : -1 
            });
        }
        conn.query("SELECT COUNT(*) AS count FROM searchpw WHERE Token = ?",[userToken],(err,result)=> {
            conn.release();
            if(err) {
                console.log("---- [비밀번호 초기화.1] SQL문 작동중 에러 발생 ----");
                console.log(err);
                console.log("--------------------");
                return res.status(200).json({
                    resetResult : -1
                });
            }
            if(result[0].count != 1) {
                console.log("[비밀번호 초기화] 존재하지 않는 토큰입니다.");
                return res.status(200).json({
                    resetResult : 1
                });
            } else {
                conn.query("SELECT * FROM searchpw WHERE Token = ?",[userToken],(err,result)=>{
                    conn.release();
                    if(err) {
                        console.log("---- [비밀번호 초기화.2] TTL 판단 SQL문 작동중 에러 발생 ----");
                        console.log(err);
                        console.log("--------------------");
                        return res.status(200).json({
                            resetResult : -1
                        });
                    }
                    if((parseInt(result[0].reqTime)+(parseInt(result[0].TTL)*1000)) <= parseInt(Date.now())) {
                        console.log("유효시간이 경과 되었습니다.");
                        deleteData = 1;
                    } else {
                        const hashUserPW = hash(userNewPassword); 
                        conn.query("UPDATE accounts SET userPW = ? WHERE userEmail = ?", [hashUserPW, result[0].userEmail],(err,result)=>{
                            if(err || !result) {
                                console.log("---- [비밀번호 초기화.3] 비밀번호 변경 SQL문 작동중 에러 발생 ----");
                                console.log(err);
                                console.log("--------------------");
                                return res.status(200).json({
                                    resetResult : -1
                                });
                            }
                            deleteData = 0;
                        });
                    }
                    conn.query("DELETE FROM searchpw WHERE Token = ?",[userToken],(err,result)=>{
                        conn.release();
                        if(err || !result) {
                            console.log("---- [비밀번호 초기화.4] searchpw 데이터 삭제 SQL문 작동중 에러 발생 ----");
                            console.log(err);
                            console.log("--------------------");
                            return res.status(200).json({
                                resetResult : -1
                            });
                        }
                        if(deleteData == 1) {
                            return res.status(200).json({
                                resetResult : 1
                            });
                        } else if(deleteData == 0) {
                            return res.status(200).json({
                                resetResult : 0
                            });
                        }
                    });
                });
            }
        });
    });
});

module.exports = router;