const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
var router = express.Router()

router.get('/', function(req,res){
    if(req.session.isLogined){
        res.render('hidden')
    }
    else{
        res.render('main')
    }
})

module.exports = router