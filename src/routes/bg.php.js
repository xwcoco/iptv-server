const router = require('koa-router')();
var log4js = require('log4js');

var logger = log4js.getLogger();
logger.level = 'debug';

router.get('/', async function (ctx, next) {
    logger.debug(ctx.request);
    ctx.body = 'http://'+ctx.request.header.host + '/backimages/bk1.png';
    // ctx.body = "http://192.168.2.11:8080/backimages/bk1.png";
    return true;
    // ctx.body = 'demo'
})


module.exports = router;

