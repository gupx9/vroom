This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

First:
npx prisma generate
then:
npm run dev

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

Prisma DB update:
you:
npx prisma migrate dev

everyone else: 
git pull
npx prisma migrate dev
npx prisma generate

Environment variables for SSLCommerz sandbox purchase flow:
SSLCOMMERZ_STORE_ID=your_sandbox_store_id
SSLCOMMERZ_STORE_PASSWORD=your_sandbox_store_password

# Optional, defaults to current request origin
SSLCOMMERZ_CALLBACK_BASE_URL=http://localhost:1006
