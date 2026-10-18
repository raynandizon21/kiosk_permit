import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { registerRoutes } from "./routes/index.js";

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" })); // promissory signatures are PNG data URLs
  // The Android APK serves its UI from http://localhost and calls this API across origins
  app.use("/api", (req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  registerRoutes(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}
