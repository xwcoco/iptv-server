const router = require('koa-router')();
var log4js = require('log4js');

var logger = log4js.getLogger();
logger.level = 'debug';
const IptvConfig = require("../config");


router.get('/', async function (ctx, next) {
    logger.debug(ctx.request.query);
    // console.log(ctx.request);
    // console.log(ctx.request.origin);
    let parames = ctx.request.query;
    if (parames.name !== undefined) {
        let url = await IptvConfig.proxyManager.getProxyURL(parames.name,parames);
        console.log(url);
        if (url !== "") {
            console.log("redirect to :"+url);
            // ctx.body = {
            //     url : url,
            // }
            ctx.status = 301;
            ctx.redirect(url);
        }
    }
    return true;
})


module.exports = router;
