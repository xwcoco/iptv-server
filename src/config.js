let MysqlDao = require("./mysqldao");
let Utils = require("./Utils");
const NodeCache = require( "node-cache" );

class Config {
    constructor() {
        this.ado = new MysqlDao();

        this._sig = "";

        this.myCache = new NodeCache({stdTTL: 0,checkperiod:0});
    }

    get cache() {
        return this.myCache;
    }

    async getConfig(name) {
        let sql = "SELECT value from chzb_config where name=?";
        let db = await this.ado.query(sql,[name]);

        if (db instanceof Array) {
            return db[0].value;
        }

        return "";
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

module.exports = IptvConfig;
