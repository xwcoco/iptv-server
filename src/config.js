let MysqlDao = require("./mysqldao");
let Utils = require("./Utils");
const NodeCache = require( "node-cache" );
const schedule = require('node-schedule');
let WeatherUtil = require('./WeatherUtil');

let EpgUtil = require("./EpgUtil");

class Config {
    constructor() {
        this.ado = new MysqlDao();

        this._sig = "";

        this.myCache = new NodeCache({stdTTL: 0,checkperiod:0});


        this._epg = new EpgUtil(this);

        this.doGetWeatherSchedule();

        this.doGetEPGSchedule();

    }

    get epg() {
        return this._epg;
    }

    get cache() {
        return this.myCache;
    }

    checkEPGCache() {
        let cdate = this.cache.get('cachetime');

        let date = new Date();
        let ndate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        if (cdate === undefined) {
            this.cache.set('cachetime', ndate);
            this._epg.doGetAllEPG();
        } else {
            ndate = cdate;
            ndate.setDate(ndate.getDate() + 1);
            if (date >= ndate) {
                this.cache.flushAll();
                this.cache.set('cachetime', ndate);
                this._epg.doGetAllEPG();
            }
        }
    }

    doGetWeatherSchedule() {
        let that = this;
        WeatherUtil.doGetWeatherData(that.myCache);
        schedule.scheduleJob('1 */2 * * *',()=>{
            console.log('doGetWeatherSchedule:' + new Date());
            WeatherUtil.doGetWeatherData(that.myCache);
        });
    }

    doGetEPGSchedule() {
        let that = this;
        this.checkEPGCache();
        schedule.scheduleJob('1 8 * * *',() => {
            console.log('doGetEPGSchedule:' + new Date());
            that.checkEPGCache();
        });
    }

    async getConfig(name) {
        let sql = "SELECT value from chzb_config where name=?";
        let db = await this.ado.query(sql,[name]);

        if (db instanceof Array) {
            return db[0].value;
        }

        return "";
    }

    getEPGErrorNum(epgid) {
        let errorid = "epg_error_"+epgid;
        let tmpcache = this.myCache.get(errorid);
        if (tmpcache !== undefined)
            return tmpcache;
        return 0;
    }

    getChannelEPGErrorNum(channelName,epgid) {
        let errorid = "epg_error_"+channelName+"_" +epgid;
        let tmpcache = this.myCache.get(errorid);
        if (tmpcache !== undefined)
            return tmpcache;
        return 0;
    }

    incChannelEPGError(channelName,epgid) {
        let errorid = "epg_error_"+channelName+"_" +epgid;
        let tmpcache = this.myCache.get(errorid);
        if (tmpcache !== undefined) {
            tmpcache = tmpcache + 1;
            this.myCache.set(errorid,tmpcache);
            return;
        }
        this.myCache.set(errorid,1);
    }

    incEPGError(epgid) {
        let errorid = "epg_error_"+epgid;
        let tmpcache = this.myCache.get(errorid);
        if (tmpcache !== undefined) {
            tmpcache = tmpcache + 1;
            this.myCache.set(errorid,tmpcache);
            return;
        }
        this.myCache.set(errorid,1);
    }

    async initConfig() {
        this._sig = await this.getConfig("app_sign");
        // console.log("sig = " + this._sig);

        this._appname = await this.getConfig("app_appname");
        // console.log("_appname = " + this._appname);

        this._packagename = await this.getConfig("app_packagename");
        // console.log("packagename = " + this._packagename);


        let tmp = this._sig+this._appname+this._packagename+"AD80F93B542B";
        this._key=Utils.MD5(tmp);
        this._key=Utils.MD5(this._key+this._appname+this._packagename);

        // console.log("key = " + this._key);
    }

    get key() {
        return this._key;
    }
}

let IptvConfig = new Config();
IptvConfig.initConfig();

Date.prototype.Format = function (fmt) { //author: meizz
    const o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (const k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

String.prototype.replaceAll = function(find, replace) {
    if (find instanceof Array) {
        let tmp = this;
        for (let i = 0; i < find.length; i++) {
            tmp = tmp.replace(new RegExp(find[i], 'g'), replace);
        }
        return tmp;
    } else
        return this.replace(new RegExp(find, 'g'), replace);
};

String.prototype.replaceAll2 = function(find,replace) {
    let tmp = this;
    while (true) {
        let tmp1 = tmp.replace(find,replace);
        if (tmp1 === tmp) return tmp;
        tmp = tmp1;
    }

};

module.exports = IptvConfig;
