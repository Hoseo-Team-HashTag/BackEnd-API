const express = require('express')
const mysql = require('mysql') 
const path = require('path')
const static = require('serve-static')
const dbconfig = require("./config/dbconfig.json") // 값을 숨기기 위해 사용
const port = 3000

const pool = mysql.createPool({
    connectionLimit: 10,
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
})

const app = express()
app.use(express.urlencoded({extended:true})) // url을 전송에 유리한 형태로 바꾸는 것을 허용
app.use(express.json()) 
app.use('/public', static(path.join(__dirname, 'public'))) // 서버가 public이라는 디렉토리를 사용, __dirname -> 현재디렉토리(.과 동일)
app.post('/process/adduser', (req, res)=> {
    console.log('/process/adduser 호출됨 ' +req)
    
    const paramId = req.body.id;
    const paramName = req.body.name;
    const paramAge = req.body.age;
    const paramPassword = req.body.password;

    pool.getConnection((err, conn)=> {
        if(err){
            conn.release()
            console.log('Mysql getConnection error. aborted')
            res.writeHead('200', {'Content-Type' : 'text/html; charset=utf8'})
            res.write('<h1>DB server 연결 실패</h1>')
            res.end();
            return
        }

        console.log('데이터베이스 연결')

        const exec = conn.query('insert into users (id, name, age, password) values (?,?,?,?);',
                    [paramId, paramName, paramAge, paramPassword],
                    (err, result)=>{
                        conn.release()
                        console.log('실행된 SQL: ' + exec.sql)

                        if(err){
                            console.log('SQL 실행시 오류 발생')
                            console.dirr(err)
                            res.writeHead('200', {'Content-Type' : 'text/html; charset=utf8'})
                            res.write('<h1>SQL 실행 실패</h1>')
                            res.end();
                            return
                        }

                        if (result) {
                            console.dir(result)
                            console.log('Inserted 성공')

                            res.writeHead('200', {'Content-Type' : 'text/html; charset=utf8'})
                            res.write('<h2>사용자 추가 성공</h2>')
                            res.end();
                        }else{
                            console.log('Inserted 실패')

                            res.writeHead('200', {'Content-Type' : 'text/html; charset=utf8'})
                            res.write('<h1>사용자 추가 실패</h1>')
                            res.end();
                        }
                    }
        )
    })
})//req : web로 들어온 정보, res : web로 들어가는 답변

app.listen(port, () => {
    console.log('[Notice] BackEnd 서버 동작중 ... Port : ${port}')
})