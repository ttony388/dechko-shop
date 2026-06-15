# Дечко

Next.js 15 ecommerce проект с PostgreSQL, Prisma, Auth.js, Stripe, Cloudinary и Resend.

## Локално стартиране

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Отворете `http://localhost:3000`.

## Environment variables

Задължителни за базата и authentication:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="long-random-secret"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Задължителни за production email verification:

```env
RESEND_API_KEY="re_..."
EMAIL_FROM="Дечко <hello@your-verified-domain.bg>"
```

Допълнителни интеграции:

```env
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

## Миграции

За локална разработка:

```bash
npm run db:migrate
```

За production/Vercel database:

```bash
npx prisma migrate deploy
```

Миграцията `20260615143000_auth_catalog_features` добавя email verification, product statuses, tags, age group, gender, sale price и many-to-many категории.

## Seed

```bash
npm run db:seed
```

Seed-ът създава 8 категории, 50 продукта, купон `DECHKO10` и admin:

```text
admin@dechko.bg
ChangeMe123!
```

Сменете паролата извън локална среда.

## Локален тест на email verification

Без `RESEND_API_KEY` и `EMAIL_FROM`, development режимът отпечатва verification URL в конзолата на `npm run dev`.

1. Регистрирайте нов профил на `/register`.
2. Отворете отпечатания `/verify-email?token=...` URL.
3. Проверете, че login преди потвърждение е отказан.
4. След потвърждение влезте със същите credentials.
5. За нов линк използвайте `/verify-email?email=user@example.com`.

Автоматичният database smoke test е:

```bash
npm run test:features
```

## Vercel

Добавете във Vercel Project Settings > Environment Variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST=true`
- `NEXT_PUBLIC_APP_URL=https://your-domain`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- Stripe и Cloudinary променливите, ако интеграциите са активни

Преди deployment приложете миграциите към production базата с `npx prisma migrate deploy`. Използваният в `EMAIL_FROM` домейн трябва да е verified в Resend.

## Проверки

```bash
npm run typecheck
npm run lint
npm run test:features
npm run build
```
