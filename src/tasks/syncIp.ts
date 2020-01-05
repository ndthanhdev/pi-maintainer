import axios from "axios";
import publicIp from "public-ip";
import { createLogger } from "../logger";

let lastIp = "";

const syncIpLog = createLogger("syncIP");

async function shouldSync() {
  const log = syncIpLog.child(shouldSync);
  try {
    log.info(`getting ip address`);
    const curIp = await publicIp.v4();
    log.info(`lastIp: ${lastIp}`);
    log.info(`curIp: ${curIp}`);
    if (curIp === lastIp) {
      return false;
    }

    return curIp;
  } catch (error) {
    log.error(`failed. see error below`);
    log.error(error);
  }

  return false;
}

async function updateIp(domain: string, token: string, ip: string) {
  const log = syncIpLog.child(updateIp);

  const url = `https://duckdns.org/update/${domain}/${token}/${ip}`;
  log.info(`update ip: ${url}`);

  try {
    const r = await axios.get(url);

    if (r.status >= 400) {
      log.error(`update ip failed. status: ${r.status}`);
    } else {
      log.info(`update ip success: ${r.status}-${r.data}`);
      lastIp = ip;
    }
  } catch (error) {
    log.error(`update ip failed. See error below: `);
    log.error(error);
  }
}

const Domain = process.env.DOMAIN || "picute";
const Token = process.env.TOKEN || "c78391dc-d66a-4472-aa38-06df8e2c9d41";

export default () =>
  shouldSync().then(newIp => {
    if (newIp) {
      return updateIp(Domain, Token, newIp);
    }
  });
