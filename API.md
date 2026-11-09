# UrbanCart REST API

Base URL: `http://localhost:4000/api`. JSON requests require `Content-Type: application/json`. Protected routes require `Authorization: Bearer <token>`. Errors return `{ "error": "message" }` with an appropriate HTTP status.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | API status and storage mode |
| POST | `/auth/register` | Public | Register `{name,email,password}` |
| POST | `/auth/login` | Public | Log in `{email,password}` |
| GET | `/auth/me` | Customer or admin | Current profile |
| GET | `/categories` | Public | List category names |
| GET | `/books` | Public | Search and list books |
| GET | `/books/:id` | Public | Book details |
| GET | `/cart` | Customer or admin | Current cart and server subtotal |
| PUT | `/cart/:bookId` | Customer or admin | Set `{quantity}` (1 to 99) |
| DELETE | `/cart/:bookId` | Customer or admin | Remove cart item |
| POST | `/checkout` | Customer or admin | Place order with `{address}` |
| GET | `/orders` | Customer or admin | Own order history |
| GET | `/admin/books` | Admin | Full catalogue for maintenance |
| GET | `/admin/orders` | Admin | All orders |
| PATCH | `/admin/orders/:id` | Admin | Set `{status}` |
| POST | `/admin/categories` | Admin | Create `{name}` |
| PATCH | `/admin/categories/:name` | Admin | Rename `{name}` |
| DELETE | `/admin/categories/:name` | Admin | Delete an empty category |
| POST | `/admin/books` | Admin | Create book |
| PATCH | `/admin/books/:id` | Admin | Update book fields |
| DELETE | `/admin/books/:id` | Admin | Delete book |

`GET /books` accepts `q` (title, author, ISBN), `category`, `minPrice`, `maxPrice`, `available=true`, `sort=featured|price-asc|price-desc|title|newest`, `page`, and `limit` (maximum 24). Response: `{books,total,page,pages}`.

Book fields: `title`, `author`, `isbn`, `publisher`, `year`, `category`, `price`, `stock`, `cover`, `description`. Required for create: title, author, ISBN, category, price, stock, year.

Checkout address fields: `fullName`, `line1`, `city`, `state`, `postalCode`, `phone`. The server reads the current book prices and stock, calculates `subtotal`, `deliveryFee`, and `total`, and stores item snapshots on the order. Client-supplied totals are ignored. Status values: `Placed`, `Packed`, `Shipped`, `Delivered`, `Cancelled`.

Example:

```bash
curl http://localhost:4000/api/books?q=Frankenstein
```
