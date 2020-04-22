const router = require('koa-router')();
const MysqlDao = require("../mysqldao");
const Utils = require("../Utils");

const AES = require("../AES");

const IptvConfig = require("../config");

var log4js = require('log4js');

var logger = log4js.getLogger();
logger.level = 'debug';

let replaceAll = function (str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
};

let reverse = function (s) {
    return s.split("").reverse().join("");
};

let channelNumber = 1;

let getCategoryData = async function (dao, category, alisname, psw) {
    let sql = 'SELECT name,url FROM chzb_channels where category= ? order by id';
    let db = await dao.query(sql, [category]);
    let nameArray = [];
    let channelArray = [];
    if (db instanceof Array) {
        for (let i = 0; i < db.length; i++) {
            let rec = db[i];
            let index = nameArray.indexOf(rec.name);
            if (index === -1) {
                nameArray.push({
                    name: rec.name,
                    url: []
                });
                nameArray[nameArray.length - 1].url.push(rec.url);
            } else {
                nameArray[index].url.push(rec.url);
            }

        }

        for (let i = 0; i < nameArray.length; i++) {
            channelArray.push({
                num: channelNumber,
                name: nameArray[i].name,
                source: nameArray[i].url,
            });
            channelNumber = channelNumber + 1;
        }

    }
    return {
        name: alisname,
        psw: psw,
        data: channelArray,
    };
};

router.post('/', async function (ctx, next) {
    let params = ctx.request.body
    logger.debug(params.data);

    params = JSON.parse(params.data.toString());

    channelNumber = 1;

    let dao = new MysqlDao();

    let contents = [];

    let res = await getCategoryData(dao, '', "我的收藏", '');

    contents.push(res);

    let sql = "SELECT name,id,psw FROM chzb_category where enable=1 and type='default' order by id";

    let dbs = await dao.query(sql);

    for (let i = 0; i < dbs.length; i++) {
        let rec = dbs[i];
        res = await getCategoryData(dao, rec.name, rec.name, rec.psw);
        contents.push(res);
    }

    sql = "SELECT name,id,psw FROM chzb_category where enable=1 and type='vip' order by id";
    dbs = await dao.query(sql);

    for (let i = 0; i < dbs.length; i++) {
        let rec = dbs[i];
        res = await getCategoryData(dao, rec.name, rec.name, rec.psw);
        // contents.push(res);
    }

    let str = Utils.gzcompress(JSON.stringify(contents));

    sql = "select dataver from chzb_appdata";

    let version = 3;
    dbs = await dao.query(sql);


    let key = IptvConfig.key;
    key = key + params.rand;

    key = Utils.MD5(key);

    key = key.substr(7, 16);


    let aes = new AES(key);
    let enstr = aes.encrypt(str);

    let ret = enstr;

    ret = replaceAll(ret, "f", "&");
    ret = replaceAll(ret, "b", "f");
    ret = replaceAll(ret, "&", "b");
    ret = replaceAll(ret,"t", "#");
    ret = replaceAll(ret,"y", "t");
    ret = replaceAll(ret,"#", "y");
    //
    let code = ret.substr(44, 128);
    code = reverse(code);

    ret = code + ret;

    ctx.body = ret;

    return true;
    // ctx.body = 'demo'
});

module.exports = router;

