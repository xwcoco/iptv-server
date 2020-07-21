const fs = require('fs');
const path = require('path');
let request = require("request-promise");
let md5 = require("md5");

class WoniuProxy {
    constructor() {
        this._list = [];


        // console.log("WoniuProxy Path : "+__dirname);

        let fileName = path.join(__dirname,"/woniu.txt");
        let text = fs.readFileSync(fileName, 'utf8');
        let that = this;
        text.split(/\r?\n/).forEach(function (line) {
           let index = line.indexOf(",");
           if (index > 0) {
               let name = line.substr(0,index);
               let id = line.substr(index+1);
               that._list.push({
                    id : parseInt(id),
                    name : name,
               })
           }
        });
        console.log(this._list);
        // console.log(text);
    }




    get name() {
        return "woniuProxy";
    }

    get cnName() {
        return "蜗牛代理";
    }

    getChannelList(host,channelNumber) {
        let ret = [];
        for (let i = 0; i < this._list.length; i++) {
            let item = this._list[i];
            let channel = {
                num : channelNumber,
                name : item.name,
                source : [],
            };
            let url = host + "proxy?name="+this.name+"&id="+item.id;
            channel.source.push(encodeURI(url));
            ret.push(channel);
            channelNumber = channelNumber + 1;
        }
        return ret;
    }

    async getURL(params) {
        if (params.id === undefined) return "";
        let sign = md5('c=1&channelId='+params.id+'&type=3&v=109&key=ae07e6df6a17c986cf11d36e3311a0dd');
        let options = {
            uri : 'https://catv-test.chinaotttv.com/api/live/playAddress?type=3&channelId='+params.id,
            headers: {
                c : 1,
                v : 109,
                sign : sign,
            }
        }
        return await request(options).then(res => {
            // console.log(res);
            let json = JSON.parse(res);
            // console.log(json);
            if (json.d.playAddress !== undefined)
                return json.d.playAddress;
            return "";
        }).catch(err => {
            return "";
        });
    }
}

module.exports = WoniuProxy;
