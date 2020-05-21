const router = require('koa-router')();
let log4js = require('log4js');

let logger = log4js.getLogger();
logger.level = 'debug';

let MysqlDao = require("../mysqldao");
// let m3u8 = require("m3u8");


router.get('/', async function (ctx, next) {
    // logger.debug(ctx.request);
    logger.debug("m3u8");

    // let m3u = m3u8.M3U.create();

    let ret = "#EXTM3U"+"\n";

    let ado = new MysqlDao();
    let db = await ado.query("select * from chzb_channels order by cateid,id");
    if (db instanceof Array) {
        for (let i = 0; i <db.length; i++) {
            ret = ret +'#EXTINF:-1 group-title="'+db[i].category+'",'+ db[i].name + '\n';
            ret = ret + db[i].url + "\n";
        }
    }

    ctx.body = ret;
    // m3u.addPlaylistItem({
    //     title :
    // })

    return true;
})


module.exports = router;
