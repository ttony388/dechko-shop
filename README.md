# Дечко

Production-oriented children's ecommerce storefront built with Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Zustand, Auth.js, Prisma 7, PostgreSQL, Stripe, React Hook Form, Zod, and Cloudinary.

## Included

- Responsive premium storefront, category, search, product, wishlist, cart, checkout, success, account, support, policy, and 404 pages
- 50 realistic seeded products across seven categories
- Persistent cart and wishlist, variants, inventory, discounts, shipping and tax calculations
- Credentials authentication, account dashboard, orders, addresses, and profile views
- Admin dashboard with product, category, order, customer, coupon, inventory, and analytics views
- Prisma schema and CRUD-oriented API routes
- Stripe Checkout handoff with a local demo fallback when Stripe is not configured
- Signed Cloudinary upload endpoint
- Metadata, Open Graph, Product JSON-LD, sitemap, robots, and web manifest

## Local setup

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Without PostgreSQL, the catalogue and checkout still run in demo mode. Demo login: `demo@dechko.bg` / `demo1234`.

## Adding products

1. Start the application with `npm run dev`.
2. Sign in at `http://localhost:3000/login` with an administrator account.
3. Open `http://localhost:3000/admin/products`.
4. Select **Добави продукт**, complete the form, choose an image, and save.

The product is written to PostgreSQL and appears immediately in the public shop, category, search, wishlist, and product pages.

When Cloudinary variables are configured, uploaded images are stored in `dechko/products`. Without Cloudinary, local development uploads are written to `public/uploads`. Local filesystem uploads are not durable on serverless production hosting, so configure Cloudinary before deployment.

## Database

Create a PostgreSQL database and set `DATABASE_URL`. The schema includes User, Address, Product, Category, ProductImage, ProductVariant, Cart, CartItem, Order, OrderItem, Coupon, Review, and Wishlist models.

The seed command creates 50 products, variants, images, categories, the `DECHKO10` coupon, and an admin user:

```text
admin@dechko.bg
ChangeMe123!
```

Change this password immediately outside local development.

## Stripe

Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_URL`. `/api/checkout` creates a Stripe Checkout Session. Add a production webhook using `STRIPE_WEBHOOK_SECRET` to persist paid orders and update stock before launch.

## Cloudinary

Set the three Cloudinary variables. `/api/upload` returns a short-lived signature for direct browser uploads into `dechko/products`.

## Deploy

1. Provision PostgreSQL and run `npm run db:migrate` and `npm run db:seed`.
2. Add all variables from `.env.example` to the hosting platform.
3. Deploy to Vercel with `npm run build`.
4. Configure the Stripe production webhook and Cloudinary upload restrictions.
5. Replace the demo admin password and connect transactional email for password reset and order notices.

## Generated imagery

The project uses three original AI-generated assets:

- `public/hero-shop.png`
- `public/creative-kit.png`
- `public/playroom.png`

They were generated with the built-in image generation tool for this project.
