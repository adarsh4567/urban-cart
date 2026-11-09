import "dotenv/config";
import { createStore } from "./store.js";
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 4000);
try {
  const hostname = process.env.MONGODB_URI && new URL(process.env.MONGODB_URI).hostname;
  const remoteDatabase = hostname && !["localhost", "127.0.0.1", "::1"].includes(hostname);
  if (process.env.NODE_ENV === "production" || remoteDatabase) {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required in production");
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
      throw new Error("JWT_SECRET must contain at least 32 characters with a remote database");
    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12)
      throw new Error("ADMIN_PASSWORD must contain at least 12 characters with a remote database");
  }
  const store = await createStore(process.env.MONGODB_URI);
  createApp(store).listen(port, "0.0.0.0", () =>
    console.log(
      `UrbanCart API listening on http://localhost:${port} (${process.env.MONGODB_URI ? "MongoDB" : "in-memory demo"})`,
    ),
  );
} catch (e) {
  console.error("Unable to start UrbanCart:", e);
  process.exit(1);
}
