const Koa = require('koa');
const koaJson = require('koa-json');
const bodyParser = require('koa-bodyparser');
const koa_body = require("koa-body");
const path = require('path');
const http = require('http');
const fs = require('fs');
const async = require('async');
const serve = require('koa-static');
// const query = require('./mysql.js');

const app = new Koa();


let homePath = path.join(__dirname,"..","public");
app.use(koa_body({
        multipart: true, // 支持文件上传
        // encoding: 'gzip',
        formidable: {
            uploadDir: path.join(__dirname, '../public/upload/'), // 设置文件上传目录
            keepExtensions: true,    // 保持文件的后缀
            maxFieldsSize: 20 * 1024 * 1024, // 文件上传大小
            onFileBegin: (name, file) => { // 文件上传前的设置
                // console.log(`name: ${name}`);
                // console.log(file);
            },
        }
    }
));
// app.use(koaJson());

const home   = serve(homePath);
app.use(home);

const routes = require('./routes');
app.use(routes.routes(), routes.allowedMethods());


// routes
// fs.readdirSync(path.join(__dirname, 'routes')).forEach(function (file) {
//     if (~file.indexOf('.js')) app.use(require(path.join(__dirname, 'routes', file)).routes());
// });

// app.use(function (ctx, next) {
//     ctx.redirect('/404.html');
// });

// app.on('error', (error, ctx) => {
//     console.log('something error ' + JSON.stringify(ctx.onerror))
//     ctx.redirect('/500.html');
// });
// app.use(async ctx => {
//     ctx.body = 'Hello World';
// });

http.createServer(app.callback())
    .listen(8080)
    .on('listening', function () {
        console.log('server listening on: ' + 8080)
    });
