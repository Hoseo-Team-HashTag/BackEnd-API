const express = require('express')
const path = require('path');
const app = express()
const mysql = require('mysql2/promise');

const port = 10000

// const router = express.Router()
// const register = require('./register/register')
// const login = require('./login/login')
// const main = require('./main/main')
// const logout = require('./logout/logout')
// app.use('/', main)
// app.use('/register',register)
// app.use('/login', login)
// app.use('logout', logout)
// module.exports = router

const pool = mysql.createPool({
    host: '127.0.0.1',
    port: '3306',
    user: 'testid',
    password: 'test01!',
    database: 'testDB'
});

const getConn = async() => {
    return await pool.getConnection(async (conn) => conn);
};

app.listen(port, () => {
    console.log(`[Notice] BackEnd 서버 동작중 ... Port : ${port}`)
  })
