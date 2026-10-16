import "dotenv/config";
import { testConnection } from "./config/database.js";
import { createApp } from "./app.js";
import { getErrorMessage } from "./utils/helpers.js";
import { getLanIPv4Addresses } from "./utils/networkHosts.js";

const PORT = Number(process.env.PORT) || 3200;

function logNetworkUrls(label, port, path = "") {
  console.log(`${label}: http://localhost:${port}${path}`);
  for (const ip of getLanIPv4Addresses()) {
    console.log(`  → http://${ip}:${port}${path}`);
  }
}

async function startServer() {
  try {
    await testConnection();
  } catch (error) {
    console.error("MySQL connection failed:", getErrorMessage(error));
    console.error("Check MYSQL_* settings in your .env file, then run: npm run db:setup");
  }

  const app = await createApp();

  app.listen(PORT, "0.0.0.0", () => {
    logNetworkUrls("Student Kiosk", PORT, "/kiosk");
    logNetworkUrls("Admin Portal ", PORT, "/admin");
  });
}

startServer();
