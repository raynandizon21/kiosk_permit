import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { registerRoutes } from "./routes/index.js";

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" })); // promissory signatures are PNG data URLs
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
