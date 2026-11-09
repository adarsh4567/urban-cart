# UrbanCart test report

Run `npm test` for API integration tests and `npm run build` for the frontend compilation check.

## Observed result, 9 November 2026

| Check | Result |
| --- | --- |
| Catalogue search, category and price filters, sorting, pagination, details | Pass |
| Registration, duplicate email, login, protected routes | Pass |
| Cart quantity validation, checkout, server-calculated subtotal and delivery fee, history | Pass |
| Customer blocked from admin API; admin book and category management | Pass |
| Two simultaneous checkouts for one remaining copy | Pass: one order, one conflict, final stock zero |
| MongoDB replica-set simultaneous checkout and multi-item rollback | Pass: one order, one conflict; failed order kept cart and restored earlier stock decrement |
| React production build | Pass |
| Desktop storefront walkthrough in Chrome | Pass: home, sign-in, book detail, add to bag, checkout, order history, and admin dashboard |
| 400 px mobile preview in Chrome | Pass: storefront, navigation, and access message fit the viewport |
| Hosted Render and Atlas flow | Pass: homepage 200, MongoDB health, 19 books, customer registration, checkout, persisted order history, admin order list, and status update to Packed |

Four automated tests use the in-memory demo adapter with real HTTP requests. A fifth test uses a local single-node MongoDB replica set and verifies a concurrent purchase and transaction rollback. Run it with `MONGODB_TEST_URI='mongodb://127.0.0.1:27017/urbancart_test?replicaSet=rs0&directConnection=true' npm test` after starting the replica set. Without that variable, the MongoDB test is skipped.

Response-time sample: 50 sequential `GET /api/books?limit=8` requests after 5 warmups, against the local in-memory dataset of 19 books on this machine. Mean **1.53 ms**, median **1.50 ms**, p95 **1.97 ms**. Reproduce with `node scripts/benchmark.mjs` while the API is running. These are local observations, not a load or production performance claim. A formal participant usability study has not been performed; its results should be recorded from real participants before dissertation submission.
