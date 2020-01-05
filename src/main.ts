const env = require("dotenv").config({ path: process.argv[1] });
import Koa from "koa";
import { createLogger, setup as setupLogger, getLogAsHtml } from "./logger";
import { setup as setupLooper } from "./looper";
import debug from "debug";
import Router from "koa-router";

const DefaultLogPattern = `*:info>*,*:warn>*,*:error>*`;
debug.enable(process.env.DEBUG || DefaultLogPattern);

setupLogger();
setupLooper();

const mainLog = createLogger("main");

const app = new Koa();

const router = new Router().get("/", ctx => {
  const pattern = ctx.query.debug || DefaultLogPattern;
  mainLog.info(`enabling debug ${pattern}`);
  debug.enable(pattern);

  ctx.body = getLogAsHtml();
});

app.use(router.routes());

const Port = parseInt(process.env.PORT || "5000");
app.listen(Port, () => {
  mainLog.info(`app is running on port: ${Port}`);
});
