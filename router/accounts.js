const express = require("express")
const router = express.Router()

router.get('/', (req, res) => {
    console.log("Accounts.js 접근")
})

module.exports = router;