var mysql = require('mysql');

class MysqlDao {
    constructor() {
        let con = mysql.createConnection({
            host: "192.168.50.8",
            user: "homeiptv",
            password: "DcKchfC4rSb5MYHd",
            database: "homeiptv"
        });

        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
        });

        this.conn = con;
    }

    query(sql,params = []) {
        return new Promise((resolve, reject) => {
            this.conn.query(sql, params, (err, result,fields) => {
                if (err) {
                    console.log('Error running sql: ' + sql)
                    console.log(err)
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        })

    }

}

module.exports = MysqlDao;
