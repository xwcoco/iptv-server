const router = require('koa-router')();
var log4js = require('log4js');

var logger = log4js.getLogger();
logger.level = 'debug';
const MysqlDao = require("../mysqldao");

router.get('/', async function (ctx, next) {
    logger.debug(ctx.request.query);
    let ado = new MysqlDao();
    let sql = "select * from chzb_fav order by id";
    let db = await ado.query(sql);
    ctx.body = {
        code : 200,
        data : db,
    }
    return true;
    // ctx.body = 'demo'
})

router.get('/add', async function (ctx, next) {
    logger.debug(ctx.request.query);
    let ado = new MysqlDao();
    let params = ctx.request.query
    let name = params.name;
    console.log("add favortiy " + name);
    let sql = "insert into chzb_fav values (null,?)";
    let db = await ado.query(sql,[name]);
    ctx.body = {
        code : 200,
        msg : "OK",
    }
    return true;
    // ctx.body = 'demo'
})

router.get('/delete', async function (ctx, next) {
    logger.debug(ctx.request.query);
    let ado = new MysqlDao();
    let params = ctx.request.query
    let name = params.name;
    console.log("delete favortiy " + name);
    let sql = "delete from chzb_fav where name = ?";
    let db = await ado.query(sql,[name]);
    ctx.body = {
        code : 200,
        msg : "OK",
    }
    return true;
    // ctx.body = 'demo'
})

module.exports = router;

