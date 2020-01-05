import { createLogger } from "../logger";

export default function createScheduledFunction(
  fn: Function,
  frequency: number
) {
  let schedule = 0;

  const log = createLogger(`scheduler:${fn.name}`);
  log.verbose(`create from ${fn.name}`);

  return function() {
    if (schedule > Date.now()) {
      log.verbose(`${schedule} is in future => skip ${fn.name}`);
      return Promise.resolve();
    }

    log.verbose(`begin execute ${fn.name}`);
    return Promise.resolve()
      .then(() => fn())
      .catch(error => {
        log.error(`failed while execute ${fn.name}. See below`);
        log.error(error);
      })
      .finally(() => {
        schedule = Date.now() + frequency;

        log.verbose(`rescheduled ${fn.name}`);
      });
  };
}
