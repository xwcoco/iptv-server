const Koa = require('koa');
const koaJson = require('koa-json');
const bodyParser = require('koa-bodyparser');
const path = require('path');
const http = require('http');
const fs = require('fs');
const async = require('async');
const serve = require('koa-static');
// const query = require('./mysql.js');

const app = new Koa();


let homePath = path.join(__dirname,"..","public");
app.use(bodyParser());
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
