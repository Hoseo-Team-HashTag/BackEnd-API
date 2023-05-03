const express = require('express')
const path = require('path')
const static = require('serve-static') // 값을 숨기기 위해 사용
require("dotenv").config();

const port = process.env.PORT

const signup = require("./func/account/signup.js")

const app = express()
app.use(express.urlencoded({extended:true})) // url을 전송에 유리한 형태로 바꾸는 것을 허용
app.use(express.json()) 
app.use('/public', static(path.join(__dirname, 'public')))// 서버가 public이라는 디렉토리를 사용, __dirname -> 현재디렉토리(.과 동일)

app.post('/process/login', (req,res)=>{
    console.log('/process/login 호출됨 ' +req)
    const paramId = req.body.id;
    const paramPassword = req.body.password;

    console.log('로그인 요청 ' + paramId+ ' ' + paramPassword);

    pool.getConnection((err, conn)=> {
        if(err){
            conn.release();
            console.log('Mysql getConnection error. aborted');
            res.writeHead('200', {'Content-Type' : 'text/html; charset=utf-8'})
            res.write('<h1>DB서버 연결 실패</h1>')
            res.end();
            return;
        }

        const exec = conn.query("select id, name from users where id=? and password=md5(?)",
                    [paramId, paramPassword] ,
                    (err, rows) => {
                        conn.release();
                        console.log('실행된 SQL qurery: '+exec.sql);
                    
                    if(err){
                        console.dir(err);
                        res.writeHead('200', {'Content-Type' : 'text/html; charset=utf8'})
                        res.write('<h1>SQL 실행 실패</h1>')
                        res.end();
                        return;
                    }
                    if (rows.length > 0 ){
                        console.log('아이디 [%s], 패스워드가 일치하는 사용자 [%s] 찾음', paramId, rows[0].name);
                        res.writeHead('200', {'Content-Type' : 'text/html; charset=utf8'})
                        res.write('<h2>로그인 성공</h2>')
                        res.end();
                        return;
                    }
                    else{
                        console.log('아이디 [%s], 패스워드가 일치하지 않음', paramId);
                        res.writeHead('200', {'Content-Type' : 'text/html; charset=utf8'})
                        res.write('<h2>로그인 실패, 아이디와 패스워드를 확인해주세요.</h2>')
                        res.end();
                        return;
                    }
                }
        )
    })
})

app.post('/process/adduser', (req, res)=> {
    signup.signup(req,res)
})//req : web로 들어온 정보, res : web로 들어가는 답변

app.listen(port, () => {
    console.log('[Notice] BackEnd 서버 동작중 ... Port : ' + port)
})