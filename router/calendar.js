const express = require("express")
const mysql = require("../func/mysql/mysql.js")
const router = express.Router()

router.post('/Calendar', (req, res) => {
    const { user_id, title, content, calendar_date, calendar_time } = req.body; // id, 제목, 내용, 날짜, 시간을 받아옴

    const query = 'INSERT INTO calendar (user_id, title, content, calendar_date, calendar_time) VALUES (?, ?, ?, ?, ?)';
    const values = [user_id, title, content, calendar_date, calendar_time];

    mysql.pool.query(query, values, (error, results)=> {
        if(error) {
            console.error('Error saving data:', error);
            res.status(500).json({ message: 'An error occurred while saving data.'});
        } else {
            res.status(200).json({ message: 'Data saved successfully. '});
        }
    });
});
module.exports = router;