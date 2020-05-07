const IptvConfig = require('./config');
const request = require('request-promise');
const zlib = require('zlib');
const stream = require('stream');
const xml2js = require('xml2js');

class WeatherUtil {

    static doGetWeatherData(cache) {
        let data = "";
        let gunzip = zlib.createGunzip();

        // let cache = IptvConfig.cache;

        let echoStream = new stream.Writable();
        echoStream._write = function (chunk, encoding, done) {
            data = chunk.toString();
            // console.log(data);
            let parser = new xml2js.Parser(/* options */);
            parser.parseStringPromise(data)
                .then(function (result) {
                    let tmpData = WeatherUtil.getWeatherInfo(result);
                    cache.set('weatherdata_tq', tmpData);
                    WeatherUtil.GetAllWeatherData(cache);
                    console.log('Weather Done');
                })
                .catch(function (err) {
                    console.log(err);
                });
        };

        request('http://wthrcdn.etouch.cn/WeatherApi?citykey=101180101').pipe(gunzip).pipe(echoStream);

        request('https://free-api.heweather.net/s6/air/now?location=zhengzhou&key=70decfbc6d084d0b9e0d30f33dc54135').then(function (htmlString) {
            // console.log(htmlString);
            let json = JSON.parse(htmlString);
            cache.set('weatherdata_aqi', json);
            WeatherUtil.GetAllWeatherData(cache);
        })

    }

    static getWeatherInfo(weather) {
        let ret = {};
        ret.city = weather.resp.city[0];
        ret.updatetime = weather.resp.updatetime[0];
        ret.wendu = weather.resp.wendu[0];
        ret.fengli = weather.resp.fengli[0];
        ret.shidu = weather.resp.shidu[0];
        ret.fengxiang = weather.resp.fengxiang[0];
        ret.sunrise = weather.resp.sunrise_1[0];
        ret.sunset = weather.resp.sunset_1[0];
        let tmp = weather.resp.forecast[0].weather[0].high[0];
        ret.high = tmp.substr(3);
        tmp = weather.resp.forecast[0].weather[0].low[0];
        ret.low = tmp.substr(3);
        ret.day_type = weather.resp.forecast[0].weather[0].day[0].type[0];
        ret.night_type = weather.resp.forecast[0].weather[0].night[0].type[0];

        ret.day_icon = WeatherUtil.getWeatherIcon(ret.day_type);
        ret.night_icon = WeatherUtil.getWeatherIcon(ret.night_type);

        tmp = weather.resp.forecast[0].weather[1].high[0];
        ret.nextday_high = tmp.substr(3);
        tmp = weather.resp.forecast[0].weather[1].low[0];
        ret.nextday_low = tmp.substr(3);
        ret.nextday_day_type = weather.resp.forecast[0].weather[1].day[0].type[0];
        ret.nextday_night_type = weather.resp.forecast[0].weather[1].night[0].type[0];

        ret.nextday_day_icon = WeatherUtil.getWeatherIcon(ret.nextday_day_type);
        ret.nextday_night_icon = WeatherUtil.getWeatherIcon(ret.nextday_night_type);

        return ret;
    }

    static GetAllWeatherData(cache) {
        // let cache = IptvConfig.cache;
        let tq = cache.get("weatherdata_tq");
        if (tq === undefined) return;
        let aqi = cache.get("weatherdata_aqi");
        if (aqi === undefined) return;

        tq.aqi = aqi.HeWeather6[0].air_now_city.aqi;
        tq.qlty = aqi.HeWeather6[0].air_now_city.qlty;
        tq.pm25 = aqi.HeWeather6[0].air_now_city.pm25;
        tq.pm10 = aqi.HeWeather6[0].air_now_city.pm10;
        tq.pub_time = aqi.HeWeather6[0].air_now_city.pub_time;

        cache.set("weatherdata",tq);
    }

    static getWeatherIcon(type) {
        console.log(type);
        let code = "01"
        switch (type) {
            case "晴":
                code = "01";
                break
            case "多云":
                code = "02";
                break
            case "阴":
                code = "03";
                break
            case "阵雨":
                code = "04";
                break;
            case "雷阵雨":
                code = "05";
                break;
            case "雷阵雨伴有冰雹":
                code = "06";
                break;
            case "雨夹雪":
                code = "07";
                break;
            case "小雨":
                code = "08"
                break;
            case "中雨":
                code = "09"
                break;
            case "大雨":
                code = "13"
                break;
            case "暴雨":
                code = "14"
                break;

            case "大暴雨":
                code = "15"
                break;
            case "特大暴雨":
                code = "16"
                break;
            case "阵雪":
                code = "17"
                break;
            case "小雪":
                code = "18"
                break;
            case "中雪":
                code = "19"
                break;
            case "大雪":
                code = "20"
                break;
            case "暴雪":
                code = "21"
                break;
            case "雾":
                code = "25"
                break;
            case "冻雨":
                code = "26"
                break;
            case "沙尘暴":
                code = "27"
                break;

            case "小到中雨":
                code = "28"
                break;

            case "中到大雨":
                code = "29"
                break;
            case "大到暴雨":
                code = "30"
                break;
            case "暴雨到大暴雨":
                code = "31"
                break;
            case "大暴雨到特大暴雨":
                code = "32"
                break;

            case "小到中雪":
                code = "33"
                break;
            case "中到大雪":
                code = "37"
                break;
            case "大到暴雪":
                code = "38"
                break;
            case "浮尘":
                code = "39"
                break;
            case "扬沙":
                code = "40"
                break;
            case "强沙尘暴":
                code = "41"
                break;
            case "雨":
                code = "42"
                break;
            case "雪":
                code = "43"
                break;
            case "霾":
                code = "44"
                break;
            default:
                code = "01"
        }
        let name = "white_"+code+'.png'
        console.log("code = "+ code);
        return "/weathericon/"+name;
    }
}

module.exports = WeatherUtil;
