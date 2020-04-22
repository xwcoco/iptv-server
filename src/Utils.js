const zlib = require('zlib');
// let Base64 = require("./Base64");
let Base64 = require("js-base64").Base64;
let md5 = require("./md5");

class Utils {
    static gzcompress(str) {
        let tmp = zlib.deflateSync(str);
        let data = Base64.encode(tmp);
        return data;
    }

    static uncompress(str) {
        let tmpKey = Base64.decode(str);
        let data = zlib.inflateSync(tmpKey);
        // let data = zlib.inflate(tmpKey,function (err) {
        //     console.log(err);
        // });

        // let data = pako.inflate(tmpKey, {to: 'string'});
        return data;
    }

    static toUTF8 (inputStr) { //将中文转为UTF8
        var outputStr = "";
        for (var i = 0; i < inputStr.length; i++) {
            var temp = inputStr.charCodeAt(i);
            //0xxxxxxx
            if (temp < 128) {
                outputStr += String.fromCharCode(temp);
            }
            //110xxxxx 10xxxxxx
            else if (temp < 2048) {
                outputStr += String.fromCharCode((temp >> 6) | 192);
                outputStr += String.fromCharCode((temp & 63) | 128);
            }
            //1110xxxx 10xxxxxx 10xxxxxx
            else if (temp < 65536) {
                outputStr += String.fromCharCode((temp >> 12) | 224);
                outputStr += String.fromCharCode(((temp >> 6) & 63) | 128);
                outputStr += String.fromCharCode((temp & 63) | 128);
            }
            //11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
            else {
                outputStr += String.fromCharCode((temp >> 18) | 240);
                outputStr += String.fromCharCode(((temp >> 12) & 63) | 128);
                outputStr += String.fromCharCode(((temp >> 6) & 63) | 128);
                outputStr += String.fromCharCode((temp & 63) | 128);
            }
        }
        return outputStr;
    }

    static MD5(str) {
        let tmp = Utils.toUTF8(str);
        return md5(tmp);
    }


}

module.exports = Utils;
