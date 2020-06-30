const router = require('koa-router')();
const MysqlAdo = require("../mysqldao");
let log4js = require('log4js');
let fs = require("fs");

var logger = log4js.getLogger();
logger.level = 'debug';


let findCategoryId = function(name,msg) {
    if (msg.category === null || !msg.category instanceof Array) return -1;
    for (let cate of msg.category) {
        if (cate.name === name) return cate.id;
    }
    return -1;
}

let addProgByFile = async function(file,msg) {
    try {
        let fileContent = fs.readFileSync(file);
        let data = JSON.parse(fileContent.toString("utf-8"));
        if (data === undefined || data === null) {
            msg.error = 1;
            msg.msg = "不是JSON格式";
            return;
        }
        if (!data instanceof Array) {
            msg.error = 1;
            msg.msg = "不是数组!";
            return;
        }

        let ado = msg.ado;

        for (let cate of data) {
            if (!cate.data instanceof Array || cate.data.length === 0)
                continue;

            let cateName = cate.name;
            let cateId = findCategoryId(cateName,msg);
            if (cateId === -1) {
                let db = await ado.query('select max(id) as id  from chzb_category');
                let id = db[0].id;
                id = id + 1;
                await ado.query("insert into chzb_category (id,name,enable,psw,type) values (?,?,?,?,?)",[id,cateName,"1","","default"]);
                cateId = id;
            }

            for (let channel of cate.data) {
                if (channel.source === null || !channel.source instanceof Array || channel.source.length === 0)
                    continue;
                for (let source of channel.source) {
                    await ado.query('insert into chzb_channels (id,name,url,category,cateid) values (null,?,?,?,?)',[channel.name,source,cateName,cateId]);
                    msg.num = msg.num + 1;
                }
            }
        }

    }
    catch (e) {
        msg.msg = e.toString();
        console.log(e);
    }


};

router.post('/', async function (ctx, next) {

    logger.log("load program from upload file....");

    const files = ctx.request.files.file;

    let ado = new MysqlAdo();
    let data = await ado.query('select * from chzb_category order by id');


    let msg = {
        error : 0,
        msg : "",
        category : data,
        ado : ado,
        num : 0,
    }

    if (files instanceof Array) {
        for (let file of files) {
            await addProgByFile(file.path,msg);
        }

    } else {
        await addProgByFile(files.path,msg);
    }

    console.log(msg);
    if (msg.error === 0) {
        msg.msg = "成功保存"+msg.num+"个频道!";
    }

    ctx.body = {
        success : msg.error === 0,
        msg : msg.msg,
    }
    // return "上传成功！";

    // logger.log(ctx);
    // ctx.body = 'http://'+ctx.request.header.host + '/backimages/bk1.png';
    // ctx.body = "http://192.168.2.11:8080/backimages/bk1.png";

    return true;
    // ctx.body = 'demo'
})


module.exports = router;
