import { pipe, when } from "ramda";
import execa from "execa";
import { createLogger } from "./logger";
import path from "path";
import syncIp from "./tasks/syncIp";
import checkHealth from "./tasks/checkHealth";
import createScheduledFunction from "./utils/createScheduledFn";

const looperLog = createLogger("looper");

function loadTasks() {
  return [
    createScheduledFunction(syncIp, parseInt(process.env.SYNCIP_FREQ || "10000")),
    createScheduledFunction(checkHealth, parseInt(process.env.HEALTH_INTERVAL || "5000"))
  ];
}

function batch(fn: Function) {
  fn();
}

function loop(tasks: Function[], time: number) {
  const log = looperLog.child(loop);
  log.info("init loop");
  let count = 0;
  return setInterval(() => {
    log.info(`run loop ${++count}`);
    tasks.forEach(batch);
  }, time);
}

export function setup() {
  const LoopTime = parseInt(process.env.LOOP || "10000");

  const tasks = loadTasks();
  loop(tasks, LoopTime);
}
