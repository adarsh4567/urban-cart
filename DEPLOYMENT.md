# Free deployment

UrbanCart uses one Render free web service for React and Express, plus one MongoDB Atlas Free cluster for persistent data. The React build is served by Express, so the browser calls the API on the same origin. `render.yaml` specifies the free plan, build and start commands, Node version, health check, and required runtime variables.

## 1. MongoDB Atlas

Create a **Free** cluster in Atlas. Create a database user with read and write access to the UrbanCart database and a strong generated password. Add a network access rule that permits the Render service to reach the cluster. Render's free service does not provide a fixed outbound IP, so the practical free-tier setup may require Atlas's `0.0.0.0/0` rule; use a unique strong database password and TLS connection string. Copy the Atlas `mongodb+srv://...` application connection string. UrbanCart uses the `urbancart` database by default even when the URI has no database path.

## 2. GitHub and Render

Push only the tracked project files to a GitHub repository. In Render, create a Blueprint from that repository's `render.yaml`. Confirm the web service uses the **Free** plan. During initial Blueprint creation, enter the Atlas connection string for `MONGODB_URI` and a private administrator password of at least 12 characters for `ADMIN_PASSWORD`. Render generates `JWT_SECRET`. `ADMIN_EMAIL` defaults to `admin@urbancart.test`.

The service builds with `npm ci && npm run build` and starts with `npm start`. `NODE_ENV=production` requires MongoDB and valid secrets, so it cannot silently fall back to ephemeral storage. The first start seeds 19 books, categories, and the configured admin account. Subsequent restarts reuse the database and keep the configured admin password current. Use the same `ADMIN_PASSWORD` value as your local `.env` if you want the local and hosted administrator login to match.

## 3. Verify

Open the service's `https://...onrender.com` URL and check `/api/health` for `{ "ok": true, "mode": "mongodb" }`. Register a reader, browse and search books, add one to the cart, submit a simulated order, and inspect order history. Sign in with the configured admin account, confirm that the order appears, update its status, and verify the stock decreased. Refresh the page to confirm that the order persists.

The free Render service sleeps after inactivity and may take about a minute to wake. Atlas Free clusters can pause after 30 days of inactivity; resume the cluster in Atlas if needed. No live payment is taken. Monitor each provider's free-tier usage and do not enable paid add-ons. Official current limits: [Render free services](https://render.com/docs/free) and [Atlas Free clusters](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/).
