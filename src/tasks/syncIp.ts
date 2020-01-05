import axios from "axios";
import publicIp from "public-ip";
import { createLogger } from "../logger";

let lastIp = "";
let nextPush = 0;

const syncIpLog = createLogger("syncIP");

async function shouldSync() {
  const log = syncIpLog.child(shouldSync);
  try {
    log.info(`getting ip address`);
    const curIp = await publicIp.v4();
    log.info(`lastIp: ${lastIp}`);
    log.info(`curIp: ${curIp}`);

    if (curIp !== lastIp) {
      log.verbose(
        `update cause curIP(${curIp}) doesn't match lastIP(${lastIp})`
      );
      return curIp;
    }

    const now = Date.now();
    if (nextPush < now) {
      log.verbose(`update cause nextPush(${nextPush}) < now(${now})`);
      return curIp;
    }

    return false;
  } catch (error) {
    log.error(`failed. see error below`);
    log.error(error);
  }

  return false;
}

async function updateIp(domain: string, token: string, ip: string) {
  const log = syncIpLog.child(updateIp);

  const url = `https://duckdns.org/update/${domain}/${token}/${ip}`;
  log.info(`update domain ${domain} 's ip to: ${ip}`);

  try {
    const r = await axios.get(url);

    if (r.status >= 400 || r.data === "KO") {
      log.error(`update ip failed.`);
      log.error(`status: ${r.status}`);
      log.error(`data: ${r.data}`);
    } else {
      log.info(`update ip success.`);
      log.info(`status: ${r.status}`);
      log.info(`data: ${r.data}`);
      lastIp = ip;
      nextPush =
        Date.now() + parseInt(process.env.SYNCIP_PUSH_FREQ || "3600000");
      log.verbose(`next force push: ${nextPush}`);
    }
  } catch (error) {
    log.error(`update ip failed. See error below: `);
    log.error(error);
  }
}

const Domain = process.env.DOMAIN || "picute";
const DuckToken = process.env.DUCK_TOKEN || "";

export default function syncIP() {
  return shouldSync().then(newIp => {
    if (newIp) {
      return updateIp(Domain, DuckToken, newIp);
    }
  });
}
