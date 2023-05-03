const express = require("express")
const router = express.Router()

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