const fs = require('fs')
const path = require('path')

class ProxyManager {
    constructor() {
        this._list = [];
        this.loadProxys();
        // console.log(this._list);
    }

    get proxyList() {
        return this._list;
    }

    loadProxys() {

        let tmpPath = path.join(__dirname,"/proxy");
        console.log(tmpPath);
        const files = fs.readdirSync(tmpPath)
        files
            .filter(file => ~file.search(/^[^\.].*\.js$/))
            .forEach(file => {
                const file_name = file.substr(0, file.length - 3);
                const file_entity = require(path.join(tmpPath, file));
                console.log(file_name);
                console.log(file_entity);
                // let proxy = Object.create(file_entity);
                let proxy = new file_entity();
                // proxy.init();
                // console.log(proxy.name);
                this._list.push(proxy);
                // if (file_name !== 'index') {
                //     router.use(`/${file_name}`, file_entity.routes(), file_entity.allowedMethods())
                // }
            })
    }

    getAllProxyChannels(host,contents,channelNumber) {
        console.log(host);
        if (!host.endsWith("/"))
            host = host + "/";
        for (let i = 0; i < this._list.length; i++) {
            let obj = this._list[i];
            let data = obj.getChannelList(host,channelNumber);
            contents.push({
                name : obj.cnName,
                psw : "",
                data : data,
            })
        }
    }

    async getProxyURL(proxyName,params) {
        for (let i = 0; i < this._list.length; i++) {
            let obj = this._list[i];
            if (obj.name === proxyName) {
                let ret = await obj.getURL(params);
                return ret;
            }
        }
        return "";
    }
}

module.exports = ProxyManager;
