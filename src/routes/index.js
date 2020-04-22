// const router = require('koa-router')();
// const serverapi = require('../api');
//
//
// router.use('/', serverapi.routes(), serverapi.allowedMethods());
//
// module.exports = router;

const router = require('koa-router')()
const fs = require('fs')
const path = require('path')


// let super_ = router.__proto__;
//
// router.__proto__ = ({
//     match: function (path, method) {
//         console.log(path);
//         let path1 = path;
//         if (path1.startsWith("/")) {
//             path1 = path.substr(1);
//             console.log(path1);
//         }
//         return super_.match(path1,method);
//     },
//     __proto__: super_
// });

const files = fs.readdirSync(__dirname)
files
    .filter(file => ~file.search(/^[^\.].*\.js$/))
    .forEach(file => {
        const file_name = file.substr(0, file.length - 3);
        const file_entity = require(path.join(__dirname, file));
        if (file_name !== 'index') {
            router.use(`/${file_name}`, file_entity.routes(), file_entity.allowedMethods())
        }
    })

module.exports = router;

