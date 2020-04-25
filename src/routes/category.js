const router = require('koa-router')();
const MysqlAdo = require("../mysqldao");
var log4js = require('log4js');

var logger = log4js.getLogger();
logger.level = 'debug';

router.get('/', async function (ctx, next) {
    logger.debug(ctx.request.query);

    let ado = new MysqlAdo();
    let sql = "select * from chzb_category order by id";
    let db = await ado.query(sql);
    if (db instanceof Array) {
        ctx.body = {
            success : true,
            data : db,
        }
    } else {
        ctx.body = {
            success : false,
        };
    }
    return true;
    // ctx.body = 'demo'
});

router.get('/update', async function (ctx, next) {
    logger.debug(ctx.request.query);
    let params = ctx.request.query;
    let id = parseInt(params.id);
    let tag = parseInt(params.tag);
    let value = params.value;

    let sql = "";
    switch (tag) {
        case 0 :
            sql = "update chzb_category set name = ? where id = ?";
            break;
        case 1:
            value = parseInt(value);
            sql = "update chzb_category set enable = ? where id = ?";
            break;
        case 2:
            sql = "update chzb_category set psw = ? where id = ?";
            break;
        default:
            ctx.body = {
                success : false,
                msg : "未知参数 tag : " + tag,
            };
            return true;
    }
    let ado = new MysqlAdo();
    await ado.query(sql, [value, id]);
    ctx.body = {
        success : true,
        msg : "保存成功!"
    };
    return true;
});

router.get('/new', async function (ctx, next) {
    let ado = new MysqlAdo();
    let db = await ado.query('select max(id) as id  from chzb_category');
    let id = db[0].id;
    id = id + 1;
    await ado.query("insert into chzb_category (id,name,enable,psw,type) values (?,?,?,?,?)",[id,"list"+id,"1","","default"]);
    db = await ado.query('select * from chzb_category where id = ?',[id]);
    if (db instanceof Array) {
        ctx.body = {
            success : true,
            data : db,
        }
    } else {
        ctx.body = {
            success : false,
        };
    }
    return true;
});

router.get('/delete', async function (ctx, next) {
    let params = ctx.request.query;
    let id = parseInt(params.id);
    let ado = new MysqlAdo();
    await ado.query('delete from chzb_channels where cateid = ?',[id]);
    let db = await ado.query('delete from chzb_category where id = ?',[id]);

    ctx.body = {
        success : true,
        msg : db,
    }

});

router.get('/urllist', async function (ctx, next) {
    let params = ctx.request.query;
    console.log(params);
    let id = parseInt(params.id);
    let ado = new MysqlAdo();
    let db = await ado.query('select * from chzb_channels where cateid = ? order by id',[id]);

    let texts = "";

    if (db instanceof Array) {
        for (let i = 0; i < db.length; i++) {
            texts = texts + db[i].name + "," + db[i].url + "\n";
        }
    }

    ctx.body = {
        success : true,
        urllist : texts,
    }

    return true;

});

router.get('/savelist', async function (ctx, next) {
    let params = ctx.request.query;
    console.log(params);
    let id = parseInt(params.id);
    let texts = params.urllist.split("\n");

    if (texts instanceof Array) {

        let ado = new MysqlAdo();

        let db1 = await ado.query('select name from chzb_category where id = ?',[id]);
        if (!(db1 instanceof Array))
            return;

        let cateName = db1[0].name;

        let db = await ado.query('delete from chzb_channels where cateid = ? ',[id]);

        let num = 0;
        for (let i = 0; i < texts.length; i++) {
            let s = texts[i].trim();
            let ul = s.split(",");
            if (!(ul instanceof Array))
                continue;
            if (ul.length !== 2)
                continue;
            let name = ul[0];
            let url = ul[1];
            if (url.trim() === "" || name.trim() === "")
                continue;
            await ado.query('insert into chzb_channels (id,name,url,category,cateid) values (null,?,?,?,?)',[name,url,cateName,id]);
            num = num + 1;
        }

        ctx.body = {
            success : true,
            msg : "保存成功!共保存"+num+"条记录",
        }

    } else {
        ctx.body = {
            success : false,
            msg : "保存失败!无法解析列表!",
        }

    }

    //
    //
    // let texts = "";
    //
    // if (db instanceof Array) {
    //     for (let i = 0; i < db.length; i++) {
    //         texts = texts + db[i].name + "," + db[i].url + "\n";
    //     }
    // }
    //

    return true;

});

module.exports = router;

