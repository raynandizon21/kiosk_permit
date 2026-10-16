import os from "os";

/** Private LAN IPv4 addresses (Wi‑Fi / Ethernet), excluding loopback. */
export function getLanIPv4Addresses() {
  const nets = os.networkInterfaces();
  const addrs = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family !== "IPv4" && net.family !== 4) continue;
      if (net.internal) continue;
      addrs.push(net.address);
    }
  }

  return [...new Set(addrs)];
}
