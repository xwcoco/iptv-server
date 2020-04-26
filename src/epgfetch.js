let request = require("request-promise");
let Base64 = require("js-base64").Base64;

class EpgFetch {
    constructor(id, name, content, tvname, params) {
        this.id = id;
        this.name = name;
        this.content = content;
        this.params = params;
        this.tvname = tvname;
    }

    async getEPG() {
        if (this.params !== undefined) {
            return await this.get51zmtEPG();
        }
        if (this.name.startsWith('tvmao-'))
            return  await this.getTVMAOEPG();
        if (this.name.startsWith('cntv-'))
            return await this.getCntvEPG();
        return undefined;
    }

    async get51zmtEPG() {
        if (!this.params.xml instanceof Array) {
            console.log("not array ?");
            return undefined;
        }
        let content = JSON.parse(this.content);
        if (!content)
            return undefined;
        let tvid = -1;
        for (let i = 0; i < content.length; i++) {
            let item = content[i];
            if (item.pname === this.tvname) {
                tvid = item.etvid;
                break;
            }
        }


        if (tvid === -1)
            return undefined;

        let ret = undefined;
        let date = new Date();

        for (let i = 0; i < this.params.xml.length; i++) {
            let item = this.params.xml[i];
            if (item.$.channel === tvid) {
                if (ret === undefined) {
                    ret = {
                        code: 200,
                        msg: "请求成功!",
                        name: this.tvname,
                        tvid: this.id,
                        date: date.Format('yyyy-MM-dd'),
                        data: [],
                    }
                }
                let time = item.$.start;
                if (time.substr(0, 8) === date.Format('yyyyMMdd')) {
                    let jm = {
                        name: item.title[0.]._,
                        starttime: time.substr(8, 2) + ':' + time.substr(10, 2),
                    };
                    ret.data.push(jm);
                }
            }

        }


        return ret;
    }

    async getTVMAOEPG() {

        let tmpname = this.name.substr(6);
        let date = new Date();
        let wday = date.getDay();
        if (wday === 0)
            wday = 7;

        let jmurl =  'https://m.tvmao.com/program/'+tmpname+'-w'+wday+'.html';

        let epgpreview = '';
        await request(jmurl).then(async function (html) {
            let id1 = html.match(/action="\/query.jsp" q="(\w+)" a="(\w+)"/);
            if (!id1) return undefined;
            let id2 = html.match(/name="submit" id="(\w+)"/);
            if (!id2) return undefined;
            let keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

            let url = 'https://m.tvmao.com/api/pg?p=' + keyStr[wday * wday] + Base64.encode(id2[1] + '|' + id1[2]) + Base64.encode('|' + id1[1]);


            await request(url).then(res => {
                let tmpstr = res.replaceAll(/<tr[^>]*>/i, "");
                tmpstr = tmpstr.replaceAll(/<td[^>]*>/i, "");
                tmpstr = tmpstr.replaceAll(/<div[^>]*>/i, "");
                tmpstr = tmpstr.replaceAll(/<a[^>]*>/i, "");

                tmpstr = tmpstr.replaceAll2('<\\/a>', "");
                tmpstr = tmpstr.replaceAll2('<\\/div><\\/td>', "#");
                tmpstr = tmpstr.replaceAll2('<\\/td><\\/tr>', "|");

                tmpstr = tmpstr.replaceAll2('[1,"', '');
                tmpstr = tmpstr.replaceAll2('"]', '');
                tmpstr = tmpstr.replaceAll2('\\n', '');

                tmpstr = tmpstr.substring(0, tmpstr.length - 1);
                epgpreview = tmpstr;
            });


            // return id1;
        }).catch(err => {
            console.log(err);
            return undefined;
        });

        if (epgpreview === '') {
            return undefined;
        }

        let list1 = epgpreview.split('|');
        if (list1) {
            let ret = {
                code: 200,
                msg: "请求成功!",
                name: this.tvname,
                tvid: this.id,
                date: date.Format('yyyy-MM-dd'),
                data: [],
            };
            for (let i = 0; i < list1.length; i++) {
                let list2 = list1[i].split('#');
                if (list2 && list2.length === 2) {
                    ret.data.push({
                        name : list2[1],
                        starttime : list2[0],
                    })
                }
            }
            return  ret;
        }
        return undefined;

    }

    async getCntvEPG() {
        let tmpname = this.name.substr(5).toLocaleLowerCase();
        let date = new Date();
        let url = 'https://api.cntv.cn/epg/epginfo?serviceId=cbox&c='+tmpname+'&d='+date.Format('yyyyMMdd');

        let json = undefined;


        await request(url).then(html => {
            try {
                json = JSON.parse(html);
            }
            catch (e) {
                json = undefined;
            }
        });

        if (json) {
            console.log(json[tmpname]);
            let list = json[tmpname].program;
            if (!list) return undefined;
            let ret = {
                code: 200,
                msg: "请求成功!",
                name: this.tvname,
                tvid: this.id,
                date: date.Format('yyyy-MM-dd'),
                data: [],
            };
            for (let i = 0; i < list.length; i++) {
                ret.data.push({
                    name : list[i].t,
                    starttime : list[i].showTime,
                })
            }
            return ret;
        }

        return undefined;

    }
}

module.exports = EpgFetch;
