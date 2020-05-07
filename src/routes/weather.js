const router = require('koa-router')();
var log4js = require('log4js');

var logger = log4js.getLogger();
logger.level = 'debug';
const xml2js = require('xml2js');
var request = require('request-promise');
const IptvConfig = require('../config');
const zlib = require('zlib');
const WeatherUtil = require("../WeatherUtil");
const stream = require('stream');

router.get('/', async function (ctx, next) {
    logger.debug(ctx.request.query);

    let cache = IptvConfig.cache;

    let wdata = cache.get("weatherdata");
    if (wdata !== undefined) {
        ctx.body = wdata;
        return true;
    }

    let gunzip = zlib.createGunzip();

    var echoStream = new stream.Writable();
    echoStream._write = function (chunk, encoding, done) {
        // console.log(chunk.toString());
        data = chunk.toString();
        let parser = new xml2js.Parser(/* options */);
        parser.parseStringPromise(data)
            .then(function (result) {
                // console.dir(result);
                let tmpData = WeatherUtil.getWeatherInfo(result);
                cache.set('weatherdata_tq', tmpData);
                WeatherUtil.GetAllWeatherData();
                console.log('Weather Done');
            })
            .catch(function (err) {
                // Failed

                console.log(err);
            });


        done();
    };

    // writer.on('data', function(chunk) {
    //     data += chunk.toString();
    //     console.log(chunk);
    // });
    //
    // writer.on("end",function () {
    //     console.log(writer.toString());
    // })


    request('http://wthrcdn.etouch.cn/WeatherApi?citykey=101180101').pipe(gunzip).pipe(echoStream);

    request('https://free-api.heweather.net/s6/air/now?location=zhengzhou&key=70decfbc6d084d0b9e0d30f33dc54135').then(function (htmlString) {
        console.log(htmlString);
        let json = JSON.parse(htmlString);
        cache.set('weatherdata_aqi', json);
        WeatherUtil.GetAllWeatherData();
    })

    // console.log("data");

    // console.log(gunzip.);

    // console.log(data);
    // writer.end()
    // console.log(writer.toString())
    // console.log(writer);


    // await request('http://wthrcdn.etouch.cn/WeatherApi?citykey=101180101').then(async function (htmlString) {
    //     // let data = zlib.inflateSync(htmlString);
    //     // let data = pako.inflate(htmlString);
    //     // let unzip = zlib.createGunzip();
    //
    //     var gunzip = zlib.createGunzip();
    //     let data = "";
    //     htmlString.pipe(gunzip).pipe(data);
    //     // let data = zlib.gunzipSync(htmlString);
    //
    //     console.log(data);
    //     // zlib.Gunzip.
    //     // let data = zlib.ungzip(htmlString);
    //
    //     // await compressing.gzip.uncompress(htmlString,data,{souceType:'Buffer'});
    //     let parser = new xml2js.Parser(/* options */);
    //     await parser.parseStringPromise(data)
    //         .then(function (result) {
    //             // console.dir(result);
    //             cache.set('weatherdata',result);
    //             ctx.body = result;
    //             console.log('Done');
    //         })
    //         .catch(function (err) {
    //             // Failed
    //
    //             console.log(err);
    //         });
    //
    // });

    ctx.body = {
        code: 500,
        msg: "正在读取,下次再试...."
    }

    return true;
    // ctx.body = 'demo'
})

module.exports = router;

