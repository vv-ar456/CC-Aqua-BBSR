# 🐠 Aquanics Store — Complete Setup Guide

## File Structure
```
aquanics/
├── index.html           Homepage (hero, categories, bestsellers)
├── products.html        Product listing + filters + pagination
├── product.html         Product detail (gallery, tabs, reviews)
├── cart.html            Cart + checkout + Razorpay payment
├── login.html           OTP login & register via 2Factor
├── order-success.html   Order confirmation + delivery tracking
├── account.html         My Orders page
├── wishlist.html        Saved products
├── contact.html         Contact form + WhatsApp
├── policies.html        DOA, Returns, Shipping, Privacy, Terms
├── logo.png             Aquanics logo
├── css/
│   ├── style.css        Shared styles (navbar, cards, footer)
│   └── home.css         Homepage-specific styles
├── js/
│   ├── config.js        Supabase + Razorpay + 2Factor + utilities
│   └── ui.js            Shared UI (navbar, footer, product cards)
├── admin/
│   └── index.html       Admin panel (password-protected)
└── supabase-schema.sql  Run this in Supabase SQL Editor
```

---

## ✅ STEP 1 — Supabase Database Setup

1. Go to https://supabase.com → open your project
2. Click **SQL Editor** in the left sidebar → **New Query**
3. Paste the **entire contents** of `supabase-schema.sql` and click **Run**
4. This creates all tables and seeds default categories automatically

**Tables created:**
- `categories` + `subcategories` — navigation & filters
- `products` — your product catalogue
- `users` — customer accounts (phone + name, no passwords)
- `sessions` — login tokens (stored in DB, not cookies/localStorage)
- `orders` — all customer orders
- `promo_codes` — discount codes
- `reviews`, `support_tickets`, `settings`

---

## ✅ STEP 2 — GitHub Pages Deployment

1. Create a new GitHub repo (or use `vv-ar456/Cntkreseller`)
2. Push the entire `aquanics/` folder contents to the repo **root**
3. Go to repo **Settings → Pages → Source: main branch, / (root)**
4. Site will be live at `https://your-username.github.io/repo-name/`

**Important:** All internal links use `/page.html` format. If GitHub Pages is at a subfolder path, you'll need to update the paths or use a custom domain.

---

## ✅ STEP 3 — Admin Panel

**URL:** `your-site.com/admin/`

**Default password:** `aquanics2024`

The password is stored in the Supabase `settings` table (`admin_password` column) — NOT in the code. Change it immediately after first login:

1. Open Admin → **Settings**
2. Enter new password in "Admin Password" field → **Change Password**
3. The new password is saved to Supabase. No code changes needed.

**Admin features:**
- **Dashboard** — Revenue chart, orders by status, stats cards, recent orders
- **Orders** — Filter by status, view full order details, update delivery status
- **Products** — Add / edit / delete, set featured, toggle active/inactive
- **Categories** — Add categories with emoji + slug, add subcategories
- **Customers** — View all users, order count, total spent
- **Promo Codes** — Create percentage/flat codes, set expiry, pause/activate
- **Settings** — Store info, delivery fees, admin password

---

## ✅ STEP 4 — Add Your Products

1. Open Admin → **Products** → **+ Add Product**
2. Fill in: Name, Category, Price (required), Image URL, Description
3. Toggle **Active = ON** → **Save Product**

**For product images:**
- Go to Supabase → **Storage** → create a bucket called `products` (set to Public)
- Upload image → copy the public URL → paste in Image URL field
- Or use any direct image URL from the web

---

## 🔑 Credentials in Use

| Service | Key |
|---------|-----|
| Supabase URL | `https://dwfbqgkhefdzljewatvx.supabase.co` |
| Supabase Anon Key | In `js/config.js` |
| Razorpay Live Key | `rzp_live_SSegtOEGykPOUN` |
| 2Factor OTP Key | `2503bcf6-237e-11f1-bcb0-0200cd936042` |

> ⚠️ **Razorpay Key Secret** (`UEtLD2Nq1J6zZHqW6S2ctDdR`) — this is NEVER stored in frontend code. Keep it safe. You'll need it if you add server-side payment verification later.

---

## 🔒 Security Architecture

| What | How it's stored |
|------|----------------|
| User passwords | **None** — login is OTP-only |
| User data (name, phone) | Supabase `users` table |
| Login sessions | Supabase `sessions` table (UUID token, expires in 30 days) |
| Admin password | Supabase `settings` table (`admin_password` column) |
| Payment data | **Never stored** — handled entirely by Razorpay |
| Cart | Browser localStorage (cleared after order) |
| Wishlist | Browser localStorage (IDs only) |

---

## 🔧 Customise

| What to change | Where |
|----------------|-------|
| WhatsApp number | Search `91XXXXXXXXXX` in all HTML files, replace with your number |
| Store email | Search `support@aquanics.in` in HTML files |
| Phone number | Search `XXXX-XXXXXX` in HTML files |
| Free delivery threshold | `cart.html` → `DELIVERY_FEE_THRESHOLD` constant |
| Delivery fee | `cart.html` → `DELIVERY_FEE` constant |
| Brand colours | `css/style.css` → `:root` CSS variables |
| Admin password | Admin Panel → Settings → Change Password |
| Categories | Admin Panel → Categories |
| Products | Admin Panel → Products |

---

## 📦 How Orders Work

1. Customer browses → adds to cart (localStorage)
2. Checkout → fills delivery address
3. Clicks **Pay** → Razorpay modal opens
4. Payment success → order saved to Supabase `orders` table
5. Customer redirected to `order-success.html` with tracking timeline
6. Admin sees new order in Admin → Orders panel
7. Admin updates status (Processing → Dispatched → Delivered)
8. Customer can track status via Account → My Orders
