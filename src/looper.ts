import { pipe, when } from "ramda";
import execa from "execa";
import { createLogger } from "./logger";
import path from "path";
import syncIp from "./tasks/syncIp";
import checkHealth from "./tasks/checkHealth";

const looperLog = createLogger("looper");

type Task = {
  name: string;
  run: Function;
  frequency?: number;
  lastExecution?: number;
};

function loadTasks(): Task[] {
  return [
    {
      name: "sync-ip",
      run: syncIp,
      frequency: 10000
    },
    {
      name: "check-health",
      run: checkHealth,
      frequency: 10000
    }
  ];
}

function executeTask(task: Task) {
  const log = looperLog.child(runOrSkip);
  // begin
  Promise.resolve()
    .then(() => task.run())
    .then(() => {
      // success
      log.info(`task ${task.name} was executed success`);
    })
    .catch(error => {
      // fail
      log.error(`task ${task.name} was executed fail. See error below`);
      log.error(error);
    })
    .finally(() => {
      task.lastExecution = Date.now();
      log.verbose(`task ${task.name} was scheduled`);
    });
}

function shouldExecuteTask({ lastExecution, frequency }: Task) {
  if (!lastExecution) {
    return true;
  }

  if (!frequency) {
    return false;
  }

  const nextExecution = frequency + lastExecution;

  return nextExecution <= Date.now();
}

function runOrSkip(task: Task) {
  const log = looperLog.child(runOrSkip);
  try {
    if (!shouldExecuteTask(task)) {
      log.info(`task ${task.name} skipped`);
      return;
    }
    log.info(`task ${task.name} is going to be executed`);
    executeTask(task);
  } catch (error) {
    log.error(`failed while check task: ${task.name}`);
  }
}

function loop(tasks: Task[], time: number) {
  const log = looperLog.child(loop);
  log.info("init loop");
  let count = 0;
  return setInterval(() => {
    log.info(`run loop ${++count}`);
    tasks.forEach(runOrSkip);
  }, time);
}

export function setup() {
  const LoopTime = parseInt(process.env.LOOP || "5000");

  const tasks = loadTasks();
  loop(tasks, LoopTime);
}
