const router = require('koa-router')();
var log4js = require('log4js');

var logger = log4js.getLogger();
logger.level = 'debug';

router.get('/', async function (ctx, next) {
    logger.debug(ctx.request.query);
    ctx.body = {
        "appver": "1.0",
        "appurl": "http://127.0.0.1/1.apk",
        "appsets": "1",
        "appsize": "",
        "apptext": ""
    };
    return true;
    // ctx.body = 'demo'
})

module.exports = router;

