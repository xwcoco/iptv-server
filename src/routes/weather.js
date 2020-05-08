const router = require('koa-router')();
var log4js = require('log4js');

var logger = log4js.getLogger();
logger.level = 'debug';
const IptvConfig = require('../config');
let WeatherUtil = require('../WeatherUtil');

router.get('/', async function (ctx, next) {
    logger.debug("get weather : ");

    let cache = IptvConfig.cache;

    let wdata = cache.get("weatherdata");
    if (wdata !== undefined) {
        wdata.code = 200;
        ctx.body = wdata;
        return true;
    }

    WeatherUtil.doGetWeatherData(cache);


    ctx.body = {
        code: 500,
        msg: "正在读取,下次再试...."
    }

    return true;
    // ctx.body = 'demo'
})

module.exports = router;

