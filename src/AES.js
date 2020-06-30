var CryptoJS = require("crypto-js");

class AES {
    constructor(key,method = "AES-128-ECB",iv = "",options = 0) {
        this.key = key;
        if (key === "")
            this.key = "tvkey_luo2888";
        this.method = method;
        this.iv = iv;
        this.options = options;
    }

    encrypt(data) {
        let key = CryptoJS.enc.Utf8.parse(this.key);
        let iv = CryptoJS.enc.Utf8.parse(this.iv);
        let options = {
            iv: iv,
            mode: CryptoJS.mode.ECB,
            // padding: CryptoJS.pad.Pkcs7
        };

        let encrypted = CryptoJS.AES.encrypt(data, key, options);

        encrypted = encrypted.toString(); // 转换为字符串
        console.log(encrypted); // 9FTrAdsYkbHrRsZ1A0IsDw==
        return encrypted;
    }

    decrypt(data) {
        let key = CryptoJS.enc.Utf8.parse(this.key);
        let iv = CryptoJS.enc.Utf8.parse(this.iv);
        let options = {
            iv: iv,
            mode: CryptoJS.mode.ECB,
            // padding: CryptoJS.pad.Pkcs7
        };

        let encrypted = CryptoJS.AES.decrypt(data, key, options);

        encrypted = encrypted.toString(); // 转换为字符串
        console.log(encrypted); // 9FTrAdsYkbHrRsZ1A0IsDw==
        return encrypted;
    }
}

module.exports = AES;
