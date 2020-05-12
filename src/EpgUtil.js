let request = require("request-promise");
const MysqlDao = require("./mysqldao");
const xml2js = require('xml2js');

class EpgUtil {

    /**
     *
     * @param config
     */
    constructor(config) {
        this.config = config;
        this.dao = new MysqlDao();
        this.cache = config.cache;
        this.loading = false;
    }

    async doGetAllEPG() {
        console.log("load epg....")
        if (this.loading) return;
        this.loading = true;
        let sql = "select * from chzb_epg order by id";
        let db = await this.dao.query(sql);
        if (!db instanceof Array) return;
        for (let i = 0; i < db.length; i++) {
            let content = db[i].content;
            let plist = JSON.parse(content);
            if (!plist instanceof Array)
                continue;
            this.getChannelEPG(db[i].id,db[i].name.trim(),db[i].content);
        }
        this.loading = false;
    }

    getChannelEPG(epgid,epgname,epgcontent) {
        // if (this.cache.get(channelName) !== undefined)
        //     return;
        if (epgname.startsWith('51zmt-')) {
            let xmlfile = 'e.xml';
            let epgname1 = epgname.substr(6);

            let pos = epgname1.indexOf('-');
            if (pos !== -1) {
                let tmp = epgname1.substr(0,pos);
                xmlfile = tmp+'.xml';
            }

            let that = this;
                request('http://epg.51zmt.top:8000/'+xmlfile)
                    .then(function (htmlString) {
                        let parser = new xml2js.Parser(/* options */);
                        parser.parseStringPromise(htmlString)
                            .then(function (result) {
                                // console.dir(result);
                                // that.cache.set('xml51cache_'+xmlfile,result.tv.programme);
                                let xml51 = result.tv.programme;
                                that.get51zmtEPG(epgid,epgname,epgcontent,xml51);
                                console.log('read 51zmt Done');
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
                        that.config.incEPGError(epgid);
                    });
        }
        else if (epgname.startsWith('tvmao-')) {
            this.getTVMAOEPG(epgid,epgname,epgcontent);
        } else if (tepgname.startsWith('cntv-')) {
            this.getCntvEPG(epgid,epgname,epgcontent);
        }

    }

    get51zmtChannelEPG(tvid,channelName,xml) {
        if (tvid === -1)
            return;

        if (this.cache.get(channelName) !== undefined)
            return;

        let date = new Date();
        let ret = undefined;
        for (let i = 0; i < xml.length; i++) {
            let item = xml[i];
            if (item.$.channel === tvid) {
                if (ret === undefined) {
                    ret = {
                        code: 200,
                        msg: "请求成功!",
                        name: channelName,
                        tvid: tvid,
                        date: date.Format('yyyy-MM-dd'),
                        data: [],
                    }
                }
                let time = item.$.start;
                if (time.substr(0, 8) === date.Format('yyyyMMdd')) {
                    // console.log(item);
                    let desc = "";
                    if (item.desc instanceof Array && item.desc.length > 0) {
                        desc = item.desc[0]._;
                        if (desc === undefined)
                            desc = "";
                        // if (desc !== "")
                        //     console.log(desc);
                        // desc = desc.trim();
                    }
                    let jm = {
                        name: item.title[0.]._,
                        starttime: time.substr(8, 2) + ':' + time.substr(10, 2),
                        desc : desc,
                    };
                    ret.data.push(jm);
                }
            }

        }
        if (ret.data.length === 0) return;
        this.cache.set(channelName,ret);
    }

    get51zmtEPG(epgid,epgname,epgcontent,xml) {
        if (!xml instanceof Array) {
            console.log("not array ?");
            return;
        }
        let content = JSON.parse(epgcontent);
        if (!content)
            return;
        for (let i = 0; i < content.length; i++) {
            let item = content[i];
            this.get51zmtChannelEPG(item.etvid,item.pname,xml);
        }
    }

    getTVMAOEPG(epgid,epgname,epgcontent) {

        let tmpname = epgname.substr(6);
        let date = new Date();
        let wday = date.getDay();
        if (wday === 0)
            wday = 7;

        let jmurl =  'https://m.tvmao.com/program/'+tmpname+'-w'+wday+'.html';

        let epgpreview = '';
        let that = this;
        request(jmurl).then(function (html) {
            let id1 = html.match(/action="\/query.jsp" q="(\w+)" a="(\w+)"/);
            if (!id1) return;
            let id2 = html.match(/name="submit" id="(\w+)"/);
            if (!id2) return;
            let keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

            let url = 'https://m.tvmao.com/api/pg?p=' + keyStr[wday * wday] + Base64.encode(id2[1] + '|' + id1[2]) + Base64.encode('|' + id1[1]);


            request(url).then(res => {
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
                if (epgpreview === '') {
                    return;
                }

                let list1 = epgpreview.split('|');
                if (list1) {
                    let ret = {
                        code: 200,
                        msg: "请求成功!",
                        name: "",
                        tvid: epgid,
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
                    if (ret.data.length === 0) return;
                    let content = JSON.parse(epgcontent);
                    if (!content)
                        return;
                    for (let i = 0; i < content.length; i++) {
                        let item = content[i];
                        let channelName = item.pname;
                        if (that.cache.get(channelName) !== undefined)
                            continue;
                        ret.name = channelName;
                        that.cache.set(channelName,ret);
                    }

                }

            });


            // return id1;
        }).catch(err => {
            console.log(err);

        });

    }

    getCntvEPG(epgid,epgname,epgcontent) {
        let tmpname = epgname.substr(5).toLocaleLowerCase();
        let date = new Date();
        let url = 'https://api.cntv.cn/epg/epginfo?serviceId=cbox&c='+tmpname+'&d='+date.Format('yyyyMMdd');

        let json = undefined;
        let that = this;
        request(url).then(html => {
            try {
                json = JSON.parse(html);
                if (json) {
                    // console.log(json[tmpname]);
                    let list = json[tmpname].program;
                    if (!list) return;
                    let ret = {
                        code: 200,
                        msg: "请求成功!",
                        name: "",
                        tvid: epgid,
                        date: date.Format('yyyy-MM-dd'),
                        data: [],
                    };
                    for (let i = 0; i < list.length; i++) {
                        ret.data.push({
                            name : list[i].t,
                            starttime : list[i].showTime,
                        })
                    }
                    if (ret.data.length === 0) return;
                    let content = JSON.parse(epgcontent);
                    if (!content)
                        return;
                    for (let i = 0; i < content.length; i++) {
                        let item = content[i];
                        let channelName = item.pname;
                        if (that.cache.get(channelName) !== undefined)
                            continue;
                        ret.name = channelName;
                        that.cache.set(channelName,ret);
                    }
                }

            }
            catch (e) {
                json = undefined;
            }
        });




    }
}

module.exports = EpgUtil;
