const express = require('express')
const app = express()
const path = require('path')
const static = require('serve-static') // 값을 숨기기 위해 사용
const cors = require('cors')

require("dotenv").config();

const port = process.env.PORT

const indexRouter = require("./router")
const accountRouter = require("./router/accounts")

app.use(cors({
    origin: 'http://localhost:8000',
    credentials: true,
}))

app.use(express.urlencoded({extended:true})) // url을 전송에 유리한 형태로 바꾸는 것을 허용
app.use(express.json()) 

app.use('/public', static(path.join(__dirname, 'public')))// 서버가 public이라는 디렉토리를 사용, __dirname -> 현재디렉토리(.과 동일)
app.use("/", indexRouter)
app.use("/accounts",accountRouter)

app.use((req, res, next) => {
    res.status(404).send("존재하지 않는 주소입니다. 주소를 다시 확인해주세요.")
})

app.listen(port, () => {
    console.log('[Notice] BackEnd 서버 동작중 ... Port : ' + port)
})