# UrbanCart system design

## Flow

React uses the Express REST API. The API validates inputs, authenticates signed JWTs, checks roles, and uses a storage adapter. The default adapter is in-memory for a zero-setup demo; the MongoDB adapter uses Mongoose and a replica set for persistent data. The UI does not access the database directly.

```text
Browser / React → Express API → MemoryStore (demo)
                            ↘ MongoStore → MongoDB replica set
```

## MongoDB collections

| Collection | Main fields | Indexes and relationships |
| --- | --- | --- |
| `users` | name, email, passwordHash, role | Unique email; password stored with bcrypt hash |
| `categories` | name | Unique name |
| `books` | title, author, ISBN, publisher, year, category, price, stock, cover, description | Unique ISBN; text index on title, author, ISBN; category and price index |
| `carts` | user, items `{book,quantity}` | Unique user reference; items reference books |
| `orders` | user, embedded item snapshots, address, subtotal, deliveryFee, total, status | User index; items keep title, author, cover, price, quantity at purchase time |

The data model is defined in `server/models.js`. The API checks valid quantities, non-negative stock and prices, required fields, and access roles. The React app also provides form validation for user feedback.

## Order consistency

The MongoDB checkout transaction reads the cart, conditionally decrements each book only if enough stock remains, creates the order with server-calculated prices and fees, and deletes the cart. A failure aborts all changes. A competing checkout for one remaining copy can succeed only once. The in-memory adapter performs the equivalent state transition without an `await` between checking and updating stock, so the demo also prevents overselling in a single Node process.

## Security and scope

JWTs expire after seven days. Admin routes check the authenticated user's role. Passwords are hashed with bcrypt. Express limits JSON request size to 100 KB and validates key inputs. This is a presentation prototype: known demo accounts and a local fallback JWT secret are provided for setup. For deployment, set a private `JWT_SECRET`, replace demo credentials, add rate limiting and operational monitoring, and serve only over HTTPS.
