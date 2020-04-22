const router = require('koa-router')();
var log4js = require('log4js');

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

module.exports = router;
