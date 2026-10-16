/**
 * Real-time updates over Server-Sent Events.
 * Every write is recorded with logModel.addLog, which calls broadcast() — so the kiosk and
 * every open admin page learn about changes without refreshing.
 */
const clients = new Set();

const KEEPALIVE_MS = 25_000;

/** GET /api/events */
export function subscribe(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 3000\n\n");
  clients.add(res);

  const keepalive = setInterval(() => res.write(": ping\n\n"), KEEPALIVE_MS);
  req.on("close", () => {
    clearInterval(keepalive);
    clients.delete(res);
  });
}

export function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of clients) res.write(payload);
}
