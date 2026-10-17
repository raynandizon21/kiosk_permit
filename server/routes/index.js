import periodRoutes from "./periodRoutes.js";
import studentRoutes from "./studentRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import permitRoutes from "./permitRoutes.js";
import promissoryRoutes from "./promissoryRoutes.js";
import withdrawalRoutes from "./withdrawalRoutes.js";
import logRoutes from "./logRoutes.js";
import authRoutes from "./authRoutes.js";
import fileMaintenanceRoutes from "./fileMaintenanceRoutes.js";
import { getHealth, getPing, getServerInfo } from "../controllers/healthController.js";
import { subscribe } from "../utils/events.js";

export function registerRoutes(app) {
  app.get("/api/ping", getPing);
  app.get("/api/health", getHealth);
  app.get("/api/server-info", getServerInfo);
  app.get("/api/events", subscribe);
  app.use("/api/auth", authRoutes);
  app.use("/api/period", periodRoutes);
  app.use("/api/students", studentRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/permits", permitRoutes);
  app.use("/api/promissory-notes", promissoryRoutes);
  app.use("/api/withdrawals", withdrawalRoutes);
  app.use("/api/logs", logRoutes);
  app.use("/api/file-maintenance", fileMaintenanceRoutes);
}
