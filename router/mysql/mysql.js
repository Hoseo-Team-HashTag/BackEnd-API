const mysql = require('mysql2')
const dbconfig = require("../../config/dbconfig.json")

const pool = mysql.createPool({
    connectionLimit: 10,
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
})

module.exports = {
    pool
}