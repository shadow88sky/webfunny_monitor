const Koa = require('koa')
// 路由
const bodyParser = require('koa-bodyparser')
const httpRoute = require('./routes')
const wsRoute = require('./routes/ws')
const log = require("./config/log")
let WebSocket = require("koa-websocket")
const statusCode = require('./util/status-code')
const err = require('./middlreware/error')
const app = WebSocket(new Koa())

app.use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*")
    ctx.set("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS")
    ctx.set("Access-Control-Allow-Headers", "*")
    ctx.set("Access-Control-Allow-Credentials", true)
    ctx.set("X-Powered-By", "3.2.1")
    ctx.set("Content-Type", "application/json;charset=utf-8")
    ctx.set("Connection", "close")
    if (ctx.method == 'OPTIONS') {
        ctx.body = 200; 
    } else {
        await next();
    }
})
// 登录校验
app.use(err())

// middlewares
app.use(bodyParser({
    enableTypes: ['json', 'form', 'text'],
    formLimit: "5mb",
    jsonLimit: "5mb",
    textLimit: "5mb"
}))

app.use(async (ctx, next) => {
    const start = new Date()
    let ms = 0
    try {
        await next();
        ms = new Date() - start
    } catch (error) {
        //记录异常日志
        log.error(ctx, error, ms);
        ctx.response.status = 500;
        ctx.body = statusCode.ERROR_500('服务器异常，请检查 logs/error 目录下日志文件', "")
    }
})

// routes
app.use(httpRoute.routes(), httpRoute.allowedMethods())
app.ws.use(wsRoute.routes(), wsRoute.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});

module.exports = app

