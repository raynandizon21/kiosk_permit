import os from "os";
import { pool } from "../config/database.js";
import { getLanIPv4Addresses } from "../utils/networkHosts.js";

/** Where tablets on the same network can reach this server (shown in the status badge panel). */
export async function getServerInfo(_req, res) {
  let database = true;
  try {
    await pool.execute("SELECT 1");
  } catch {
    database = false;
  }
  const port = Number(process.env.PORT) || 3200;
  res.json({
    hostname: os.hostname(),
    port,
    database,
    addresses: getLanIPv4Addresses().map((ip) => `http://${ip}:${port}`),
  });
}

/** Network-only check (no DB). */
export function getPing(_req, res) {
  res.json({ ok: true, status: "online" });
}

export async function getHealth(_req, res) {
  try {
    await pool.execute("SELECT 1");
    res.json({ ok: true, status: "online", database: true });
  } catch {
    res.status(503).json({ ok: false, status: "offline", database: false });
  }
}
