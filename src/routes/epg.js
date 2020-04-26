const router = require('koa-router')();
var log4js = require('log4js');
const MysqlAdo = require("../mysqldao");
var request = require('request-promise');
const IptvConfig = require('../config');
const xml2js = require('xml2js');
let EpgFetch = require('../epgfetch');
const zlib = require('zlib');

var logger = log4js.getLogger();
logger.level = 'debug';

router.get('/live_proxy_epg.php/out_epg', async function (ctx, next) {
    logger.debug(ctx.request.query);
    let params = ctx.request.query;


    let cache = IptvConfig.cache;

    let cdate = cache.get('cachetime');

    let date = new Date();
    let ndate = new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
    ndate.setDate(ndate.getDate() + 1);
    if (cdate === undefined) {
        cache.set('cachetime',ndate);
    } else {
        if (date >= cdate) {
            cache.flushAll();
            cache.set('cachetime',ndate);
        }
    }

    let item = cache.get(params.id);
    if (item !== undefined) {
        ctx.body = item;
        return;
    }

    let ado = new MysqlAdo();
    let sql = "select * from chzb_epg where status = 1 and content like '%"+params.id+"%'";
    let db = await ado.query(sql);


    if (!db instanceof Array) {
        ctx.body = {
            code : 500,
            msg: "频道不存在!",
        };
        return true;
    }
    let epgid = -1;
    let epgname = "";
    let epgcontent = "";
    for (let i = 0; i < db.length; i++) {
        let content = db[i].content;
        let plist = JSON.parse(content);
        if (!plist instanceof Array)
            continue;
        for (let j = 0; j < plist.length; j++) {
            if (plist[j].pname === params.id) {
                epgid = db[i].id;
                epgname = db[i].name.trim();
                epgcontent = content.trim();
                break;
            }
        }
        if (epgid !== -1)
            break;
    }

    if (epgid === -1) {
        ctx.body = {
            code : 500,
            msg: "频道EPG服务不存在!",
        };
        return true;
    }

    let epgParams = undefined;

    if (epgname.startsWith('51zmt-')) {
        let xmlfile = 'e.xml';

        let epgname1 = epgname.substr(6);
        console.log(epgname1);

        let pos = epgname1.indexOf('-');
        if (pos !== -1) {
            let tmp = epgname1.substr(0,pos);
            console.log(tmp);
            xmlfile = tmp+'.xml';
        }

        let xml51 = cache.get('xml51cache_'+xmlfile);
        if (xml51 === undefined) {
            request('http://epg.51zmt.top:8000/'+xmlfile)
                .then(function (htmlString) {
                    let parser = new xml2js.Parser(/* options */);
                    parser.parseStringPromise(htmlString)
                        .then(function (result) {
                            // console.dir(result);
                            cache.set('xml51cache_'+xmlfile,result.tv.programme);
                            console.log('Done');
                        })
                        .catch(function (err) {
                            // Failed
                            console.log(err);
                        });
                    // cache.set('xml51cache',xml51);
                    console.log("read 51zmt ok");
                })
                .catch(function (err) {
                    console.log(err);
                    ctx.body = {
                        code : 500,
                        msg: "51zmt数据读取错误!",
                    };
                    return true;
                });
            ctx.body = {
                code : 500,
                msg : "正在读取51zmt数据,下次再试",
            };
            return true;
        }
        epgParams = {
            xml : xml51,
        }
    }

    let fetch = new EpgFetch(epgid,epgname,epgcontent,params.id, epgParams);

    let epg = await fetch.getEPG();
    if (epg !== undefined) {
        ctx.body = epg;
        cache.set(params.id,epg);
    }
    else {
        ctx.body = {
            code : 500,
            msg : '未获取数据',
        };

    }

    return true;
    // ctx.body = 'demo'
});

router.get('/',async function (ctx,next) {
    let ado = new MysqlAdo();
    let db = await ado.query('select * from chzb_epg order by id');
    ctx.body = {
        success : true,
        epg : db,
    }
    return true;
});

router.get('/get51zmtcate',async function (ctx,next) {
    let ado = new MysqlAdo();
    // let db = await ado.query('select * from chzb_epg order by id');
    // ctx.body = {
    //     success : true,
    //     epg : db,
    // }
    request('http://epg.51zmt.top:8000/test.m3u', async function (error, response, body) {
        console.log(error);
        if (error) {
            ctx.body = {
                success: false,
                error : error,
            };
            return;
        }
        // console.log(body);
        let list = body.split("\n");
        if (list instanceof Array) {

            await ado.query('delete from chzb_51zmt');

            for (let i = 0; i < list.length; i++) {
                let s = list[i];
                if (s.indexOf("#EXTINF") !== -1) {
                    let nl = s.split(",");
                    if (nl.length !== 2) {
                        continue;
                    }
                    let name = nl[1];
                    nl = nl[0].split(" ");
                    let id = "";
                    let cate = "";

                    for (let j = 0; j < nl.length; j++) {
                        let index = nl[j].indexOf("tvg-id=");
                        if (index !== -1) {
                            id = nl[j].substr(index+"tvg-id=".length+1,nl[j].length-2-"tvg-id=".length);
                            continue;
                        }
                        index = nl[j].indexOf("group-title=");
                        if (index !== -1) {
                            cate = nl[j].substr(index+"group-title=".length+1,nl[j].length-2-"group-title=".length);

                        }
                    }

                    if (id !== "" && cate !== "" && name !== "") {
                        await ado.query('insert into chzb_51zmt values (null,?,?,?)',[cate,name,id]);
                    }
                }
            }
        }

    });
    ctx.body = {
        success : true,
        msg : "正在更新列表,请等待几分钟后刷新!",
    };
    return true;
});

router.get('/get51zmtcatelist',async function (ctx,next) {
    let ado = new MysqlAdo();
    let db = await ado.query('select * from chzb_51zmt order by category,id');
    let db1 = await ado.query('select id,name,category,cateid from chzb_channels  order by cateid,id');
    ctx.body = {
        success : true,
        data51 : db,
        data : db1,
    };
    return true;
});

router.get('/getalllist',async function (ctx,next) {
    let ado = new MysqlAdo();
    let db1 = await ado.query('select id,name,category,cateid from chzb_channels  order by cateid,id');
    ctx.body = {
        success : true,
        data : db1,
    };
    return true;
});

router.get('/saveepgitem',async function (ctx,next) {
    let params = ctx.request.query;
    let id = parseInt(params.id);
    let ado = new MysqlAdo();
    let name = params.source.trim() + '-' + params.name.trim();
    if (id === -1) {
        let db = await ado.query('insert into chzb_epg values(null,?,?,1,?)',[name,params.data,params.remarks]);
        ctx.body = {
            success : true,
            id : db.insertId,
            msg : '新增保存成功',
        };
    } else {
        let db = await ado.query('update chzb_epg set name = ?,content = ?,remarks = ? where id = ?',[name,params.data,params.remarks,id]);
        ctx.body = {
            success : true,
            id : id,
            msg : '保存成功',
        };
    }
    return true;
});

router.get('/delete',async function (ctx,next) {
    let ado = new MysqlAdo();
    let params = ctx.request.query;
    let id = parseInt(params.id);
    let db1 = await ado.query('delete from chzb_epg where id = ?',[id]);
    ctx.body = {
        success : true,
    };
    return true;
});

router.get('/getepgitem',async function (ctx,next) {
    let ado = new MysqlAdo();
    let params = ctx.request.query;
    let id = parseInt(params.id);
    let db1 = await ado.query('select * from chzb_epg where id = ?',[id]);
    ctx.body = {
        success : true,
        data : db1[0],
    };
    return true;
});

router.get('/setepgstatus',async function (ctx,next) {
    let ado = new MysqlAdo();
    let params = ctx.request.query;
    let id = parseInt(params.id);
    let status = parseInt(params.status);
    let db1 = await ado.query('update chzb_epg set status = ? where id = ?',[status,id]);
    ctx.body = {
        success : true,
    };
    return true;
});

module.exports = router;

