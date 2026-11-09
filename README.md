# UrbanCart

UrbanCart is a responsive MERN bookstore prototype for browsing physical books and placing simulated orders. It implements the workflows described in the supplied project outline: customer accounts, search and filters, book details, cart, delivery details, checkout, order history, and protected administration for books, categories, inventory, and order status.

## Quick start

Requirements: Node.js 20.19+ and npm.

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. The API runs at **http://localhost:4000**. With no `MONGODB_URI`, the app uses an in-memory demo store and seeds 19 books automatically. This mode is ready for presentation, but data resets whenever the API restarts.

| Account | Email | Password |
| --- | --- | --- |
| Customer | `reader@urbancart.test` | `Reader123!` |
| Administrator | `admin@urbancart.test` | `Admin123!` |

You can also register a new customer account. Checkout does not ask for payment details and does not charge money.

## MongoDB mode

MongoDB must run as a replica set because checkout uses a multi-document transaction. If Docker Desktop is available:

```bash
docker compose up -d
docker compose exec mongo mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
```

Copy `.env.example` to `.env`, set a long random `JWT_SECRET`, and uncomment:

```text
MONGODB_URI=mongodb://localhost:27017/urbancart?replicaSet=rs0&directConnection=true
```

Then restart `npm run dev`. The sample books and local demo accounts are seeded only if absent. MongoDB mode persists changes in the Docker volume. If the replica set was already initialized, the `rs.initiate` command may report that it exists; continue. Remote MongoDB connections use the private administrator credentials in `.env` and require a strong JWT secret.

For a production-style local run, use a MongoDB replica set and set `NODE_ENV=production`, `MONGODB_URI`, a private `JWT_SECRET` of at least 32 characters, and an `ADMIN_PASSWORD` of at least 12 characters:

```bash
npm run build
npm start
```

Open **http://localhost:4000**. Express serves the built React app and API on one port. Set `PORT` in `.env` if needed. Production mode requires MongoDB and does not create the public demo reader account. It creates or updates the administrator account with the configured credentials at startup.

## Free deployment

The included [Render Blueprint](render.yaml) deploys the React build and Express API as one free web service. Use a free MongoDB Atlas cluster for persistent data and transactions. The deployment steps and free-tier limits are in [DEPLOYMENT.md](DEPLOYMENT.md). Never commit `.env` or database credentials.

## What works

- Browse the catalogue with title, author, or ISBN search; category and price filters; availability filter; sorting; and pagination.
- Inspect book metadata, price, description, and current stock.
- Register, sign in, add or remove books from the cart, change quantities, enter an address, place a simulated order, and see order history.
- Manage books, categories, prices, stock, and order status with administrator authorization.
- Calculate prices and delivery fees on the server. Delivery is ₹99 for subtotals below ₹999 and free otherwise.
- Reject invalid quantities and stock shortages. MongoDB checkout uses conditional stock decrements and a transaction for stock, order creation, and cart deletion. Demo mode completes these changes in one synchronous in-memory operation.

## Project layout

```text
src/shared.jsx       Auth, API client, layout, reusable UI
src/pages/           Storefront and administrator pages
src/styles.css       Responsive styles
server/app.js        Express routes, auth, validation, authorization
server/store.js      In-memory and MongoDB data access implementations
server/models.js     MongoDB schemas and indexes
server/data/         Open Library-based seed catalogue
server/tests/        API workflow tests
compose.yaml         Local MongoDB replica set container
API.md               REST API contract
DESIGN.md            Architecture and database design
TEST_REPORT.md       Test coverage and observed results
DEPLOYMENT.md        Free hosting configuration and verification
render.yaml          Render free web service Blueprint
```

## Data and scope

Book titles, authors, ISBNs, publication years, publishers, and cover IDs were gathered from the [Open Library Search API](https://openlibrary.org/dev/docs/api/search) on 9 November 2026. Cover images load from Open Library. Prices, stock, categories, and short descriptions are demo data generated for UrbanCart; they do not represent real offers. Payment, courier tracking, e-books, and live selling are outside the assignment scope.

The supplied document is a dissertation proposal. This repository supplies the working prototype and technical documentation. A formal dissertation report, supervisor signatures, and participant-based usability findings need the student's own review and real evidence.
