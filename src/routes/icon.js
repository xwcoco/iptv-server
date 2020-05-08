const router = require('koa-router')();
var log4js = require('log4js');
const MysqlDao = require("../mysqldao");

const fs = require('fs')
const path = require('path')

var logger = log4js.getLogger();
logger.level = 'debug';

router.get('/', async function (ctx, next) {
    logger.debug(ctx.request.query);
    let data = {
        "region": "本地",
        "city": "，",
        "isp": "内网"
    };
    ctx.body = {
        data: data,
    };
    return true;
    // ctx.body = 'demo'
})

router.get('/list', async function (ctx, next) {
    let ado = new MysqlDao();
    let sql = "select * from chzb_icon order by id";
    let db = await ado.query(sql);


    if (!db instanceof Array) {
        ctx.body = {
            success: false,
            msg: "未找到数据",
        };
        return true;
    }

    ctx.body = {
        success:  true,
        path : 'http://'+ctx.request.header.host + '/icons/',
        data : db,
    }
    return  true;
})

router.get('/allicon', async function (ctx, next) {
    // logger.debug(ctx.request);

    // let ado = new MysqlDao();
    // let sql = "select * from chzb_icon order by id";
    // let db = await ado.query(sql);
    //
    //
    // if (!db instanceof Array) {
    //     ctx.body = {
    //         success: false,
    //         msg: "未找到数据",
    //     };
    //     return true;
    // }

    let ret = [];
    let filePath = path.join(__dirname,"../..","public/icons");
    const files = fs.readdirSync(filePath);
    files.forEach(file => {
        let tmpPath = path.join(filePath,file);
        const iconfiles = fs.readdirSync(tmpPath);
        let item = {
            path : file,
            icons : [],
        };
        iconfiles.forEach(icon => {
            item.icons.push(icon);
        });
        ret.push(item);
    });

    ctx.body = {
        success:  true,
        path : 'http://'+ctx.request.header.host + '/icons/',
        data : ret,
    }
    return  true;
})

router.post('/saveicon', async function (ctx, next) {
    let params = ctx.request.body
    console.log(params);

    let id = parseInt(params.id);
    let name = params.name;
    let icon = params.icon;

    let ado = new MysqlDao();
    let sql = "";
    let msg = "";
    if (id === -1) {
        sql = "insert into chzb_icon values (null,?,?)";
        await ado.query(sql,[name,icon]);
        msg = "新增 "+ name + " 完成"
    }

    else {
        sql = "update chzb_icon set name = ?,icon = ? where id = ?";
        await ado.query(sql,[name,icon,id]);
        msg = "更新 "+ name + " 完成"
    }
    ctx.body = {
        success : true,
        msg : msg,
    }
    return true;
});

router.get('/geticon', async function (ctx, next) {
    let params = ctx.request.query;
    console.log(params);

    let id = parseInt(params.id);

    let ado = new MysqlDao();
    let sql = "select * from chzb_icon where id = ?";
    let db = await ado.query(sql,[id]);
    ctx.body = {
        success : true,
        data:db,
    }
    return true;
});

router.get('/getnameicon', async function (ctx, next) {
    let params = ctx.request.query;
    console.log(params);

    let name = params.name;

    let ado = new MysqlDao();
    let sql = "select * from chzb_icon where name = ?";
    let db = await ado.query(sql,[name]);

    if (db instanceof Array && db.length > 0) {
        ctx.body = {
            code: 200,
            data: "/icons/"+db[0].icon,
        }
    }
    else {
        ctx.body = {
            code: 500,
            data: "",
        }
    }
    return true;
});

router.get('/delete', async function (ctx, next) {
    let params = ctx.request.query;
    let id = parseInt(params.id);

    let ado = new MysqlDao();
    let sql = "delete from chzb_icon where id = ?";
    let db = await ado.query(sql,[id]);
    ctx.body = {
        success : true,
        msg : "成功删除!"
    }
    return true;
});

router.post('/save', async function (ctx, next) {
    let params = ctx.request.body
    console.log(params);

    let name = params.name;
    let icon = params.icon;

    let ado = new MysqlDao();
    let sql = "select id from chzb_icon where name=?";
    let db = await ado.query(sql,[name]);

    let find = false;
    let msg = "";

    console.log(db);
    if (db instanceof Array && db.length > 0) {
        console.log("find icon record where name = "+name);
        let id = db[0].id;
        sql = "update chzb_icon set name = ?,icon = ? where id = ?";
        await ado.query(sql,[name,icon,id]);
        msg = "更新 "+ name + " 完成"
    } else {
        sql = "insert into chzb_icon values (null,?,?)";
        await ado.query(sql,[name,icon]);
        msg = "新增 "+ name + " 完成"
    }
    ctx.body = {
        success : true,
        msg : msg,
    }
    return true;
});

module.exports = router;
