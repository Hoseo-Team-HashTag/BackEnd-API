const express = require("express")
const mysql = require("../func/mysql/mysql.js")
const router = express.Router()

router.post('/Calendar', (req, res) => {
    const { user_id, title, content, calendar_date, calendar_time } = req.body; // id, 제목, 내용, 날짜, 시간을 받아옴

    if(!user_id || !title || !content || !calendar_date){
        res.status(400).json({message: 'Required fields are missing.'});
        return;
    }// id, 제목, 내용, 날짜 중 하나라도 널값인 경우 오류 반환

    const query = 'INSERT INTO calendar (user_id, title, content, calendar_date, calendar_time) VALUES (?, ?, ?, ?, ?)'; //query문
    const values = [user_id, title, content, calendar_date, calendar_time]; //프론트엔드에서 전달받은 값들을 배열로 저장

    mysql.pool.query(query, values, (error, results)=> {
        if(error) {
            console.error('Error saving data:', error);
            res.status(500).json({ message: 'An error occurred while saving data.'});
        } else {
            res.status(200).json({ message: 'Data saved successfully. '});
        }
    });//pool.query는 pool.getConnection()을 내부적으로 처리하고 연결을 가져오고 쿼리를 실행한뒤 연결을 자동으로 반환.
});
module.exports = router;