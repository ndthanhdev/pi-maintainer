import si from "systeminformation";
import bytes from "bytes";
import { createLogger } from "../logger";

const checkHealthLog = createLogger("checkHealth");

function getCpu() {
  const log = checkHealthLog.child(getCpu);
  return si
    .currentLoad()
    .then(cpu => {
      const cores = cpu.cpus.map((v, i) => {
        const id = `[${i}]`.padStart(10);
        const usage = `${v.load.toFixed(2)}%`.padStart(10);

        return `${id}${usage}`;
      });
      const total =
        `${"[total]".padStart(10)}` +
        `${cpu.currentload.toFixed(2)}%`.padStart(10);

      return [...cores, total];
    })
    .catch(error => {
      log.error("cannot get cpu usage. see below");
      log.error(error);
      return ["unknown"];
    });
}

function getMem() {
  const log = checkHealthLog.child(getMem);
  return si
    .mem()
    .then(mem => {
      return `${bytes(mem.used)}/${bytes(mem.total)}`;
    })
    .catch(error => {
      log.error("cannot get mem usage. see below");
      log.error(error);
      return "unknown";
    });
}

function getTemp() {
  const log = checkHealthLog.child(getTemp);
  return si
    .cpuTemperature()
    .then(temp => {
      return `${temp.main}`;
    })
    .catch(error => {
      log.error("cannot get cpu temperature. see below");
      log.error(error);
      return "unknown";
    });
}

export default function checkHealth() {
  const log = checkHealthLog;
  log.verbose("begin check");
  return Promise.all([getCpu(), getTemp(), getMem()]).then(
    ([cpu, temp, mem]) => {
      log.info(`CPU Temperature: ${temp}`);
      log.info("CPU usages: ");
      cpu.forEach(core => log.info(core));
      log.info(`Memory usage: ${mem}`);
    }
  );
}
