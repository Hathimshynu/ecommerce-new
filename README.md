# ShopEase – Next.js + Laravel + MySQL e-commerce

A mobile-friendly e-commerce store with SEO, an admin panel, role-based access, WhatsApp order confirmation and customer reviews with photos.

```
backend/   Laravel 13 REST API (Sanctum tokens, MySQL)
frontend/  Next.js 16 (App Router, Tailwind CSS v4)
```

## Features

**Customers**
- Browse, search, filter by category and sort products, with a multi-image swipe gallery, specifications and description
- Add to cart and Buy now. Login is required at checkout, like Flipkart
- Checkout with a delivery address. The order is saved and the screen shows **"Order placed successfully!"**
- **Mandatory WhatsApp step:** the success popup cannot be closed. The customer must tap **Send order on WhatsApp**, which opens WhatsApp to your number with the order ID, every product with qty and price, the totals and the customer's name, phone and address already filled in
- My orders shows a status timeline (Placed → Confirmed → Dispatched → Delivered) and a WhatsApp reminder if it wasn't sent yet
- Reviews with star rating, text and up to 5 photos. Only customers who bought the product can review it. Reviews appear on the home page and the product page

**Admin panel (`/admin`)**
- Dashboard with stats and recent orders
- Orders: filter and search, see whether the customer opened WhatsApp, and **manually set the status** to pending, confirmed, dispatched, delivered or cancelled, with a note to the customer. Cancelling puts the stock back. Includes a one-click WhatsApp/call to the customer
- Products: create and edit with **multiple images**, set the cover image, specifications, description, price/MRP/stock, featured or hidden, and SEO meta
- Categories, review moderation (hide/delete), users and roles, store settings (WhatsApp number, shipping, announcement)

**Roles**

| Role | Access |
|---|---|
| admin | Everything, including deleting, users & roles, and settings |
| staff | Products, categories, orders (status updates), reviews |
| customer | Shopping, orders, reviews (anyone can register) |

Roles are enforced in the API (`role` middleware), not only in the UI.

**SEO:** server-rendered pages, per-product title and description with Open Graph tags, canonical URLs, JSON-LD (Product, Offer, AggregateRating, Review, Breadcrumb, Organization), `sitemap.xml`, `robots.txt` and a web manifest.

## Setup

### 1. Backend (Laravel)
Requires PHP 8.3+, Composer and MySQL 8.

```bash
cd backend
composer install
cp .env.example .env          # set DB_DATABASE / DB_USERNAME / DB_PASSWORD and FRONTEND_URL
php artisan key:generate
mysql -u root -p -e "CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
php artisan migrate --seed    # creates tables + demo data
php artisan storage:link      # serves uploaded images from /storage
php artisan serve             # http://localhost:8000
```

### 2. Frontend (Next.js)
Requires Node 20+.

```bash
cd frontend
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev                   # http://localhost:3000
```

### 3. Demo accounts (change these in production)

| Role | Email | Password |
|---|---|---|
| Admin | admin@shop.com | admin123 (or `ADMIN_PASSWORD` in `.env`) |
| Staff | staff@shop.com | staff123 |
| Customer | customer@shop.com | customer123 |

**Set your WhatsApp number first:** Admin → Settings → WhatsApp number, with the country code and no `+` (e.g. `919876543210`).

## Order workflow
1. The customer places an order. It is saved with status **pending**.
2. The customer is required to tap **Send order on WhatsApp**, and you receive the full order in WhatsApp.
3. You verify it in WhatsApp, then go to Admin → Orders and set **confirmed → dispatched → delivered**.
4. The customer sees each update in My orders.

## Production notes
- Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` and `FRONTEND_URL` (your site's domain, used for CORS).
- Frontend: set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL` (used for canonical URLs and the sitemap), then `npm run build && npm start`.
- Seeded product photos are Unsplash links. Replace them by uploading your own images in the admin panel.
- Remove or change the demo staff and customer accounts.

## Tests
```bash
cd backend && php artisan test
```
