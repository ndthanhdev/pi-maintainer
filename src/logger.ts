import debug from "debug";
import { juxt } from "ramda";
import ansiToHtml from "./utils/asciiToHtml";

const logLines: string[] = [];

function logToMem(msg: any) {
  if (typeof msg !== "string") {
    logLines.push(JSON.stringify(msg));
  } else {
    logLines.push(msg);
  }
}

type LogFn = (msg: any) => any;

function forkLog(...logFn: LogFn[]) {
  return juxt(logFn);
}

export function getLogAsHtml() {
  return logLines.map(ansiToHtml).join("<br>\n");
}

function createInMemLog(prefix: string) {
  const log = debug(prefix);
  log.log = forkLog(debug.log, logToMem);

  return log;
}

function _createLogger(fnOrPrefix: Function | string, parentPrefix?: string) {
  let prefix = typeof fnOrPrefix === "function" ? fnOrPrefix.name : fnOrPrefix;

  if (parentPrefix) {
    prefix = `${parentPrefix}:${prefix}`;
  }

  return {
    verbose: createInMemLog(`${prefix}:verbose`),
    info: createInMemLog(`${prefix}:info`),
    warn: createInMemLog(`${prefix}:warn`),
    error: createInMemLog(`${prefix}:error`),
    child: (fnOrPrefix: Function | string) => _createLogger(fnOrPrefix, prefix)
  };
}

export function createLogger(fnOrPrefix: Function | string) {
  return _createLogger(fnOrPrefix);
}

function trimLogJob() {
  const log = createLogger(trimLogJob);
  const max = parseInt(process.env.MAX_LOG_LINE || "1000");

  return setInterval(() => {
    const trimLen = Math.max(logLines.length - max, 0);
    logLines.splice(0, trimLen);
    log.info(`trimmed ${trimLen}/${logLines.length}/${max} log lines`);
  }, 30000);
}

export function setup() {
  trimLogJob();
}
