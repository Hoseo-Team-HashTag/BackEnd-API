const authJWT = (req,res,next) => {
    try {
        const userToken = req.body.accessToken;
        const userData = jwt.verify(userToken,process.env.ACCESS_SECRET);
        mysql.pool.getConnection((err, conn)=> {
            if(err) {
                conn.release();
                console.log('Mysql getConnection error. aborted');
                return res.status(200).json({ 
                    tokenResult : 1
                });
            }
            conn.query("SELECT * FROM accounts WHERE userEmail = ?",[userData.email],(err,result) =>{
                conn.release();
                if(err || !result) {
                    console.log("---- [loginSuccess.1] User Data Error ----\n" + err + "\n--------------------");
                    console.log("---- [loginSuccess.1] User Data Error ----\n" + result + "\n--------------------");
                    return res.status(200).json({
                        tokenResult : 1
                    });                    
                }
                return res.status(200).json({
                    tokenResult : 0,
                    userEmail : result[0].userEmail,
                    userName : result[0].userName
                });
            });
    });
    } catch(error) {
        return res.status(500).json(error);
    }
};

module.exports = authJWT;