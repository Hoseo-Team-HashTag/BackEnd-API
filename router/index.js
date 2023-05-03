const express = require("express")
const router = express.Router()

router.post('/', (req, res) => {
    console.log("값 테스트 : " + req.body.number)
    return res.status(200).json({
        message:"테스트"
    })
})

module.exports = router;