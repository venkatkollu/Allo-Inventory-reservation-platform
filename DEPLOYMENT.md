# 🚀 Deployment Guide

## **Option 1: Vercel + Vercel Postgres (Recommended - 5 minutes)**

### 1. Push to GitHub (if not already done)
```bash
git add -A
git commit -m "Ready for deployment"
git push
```

### 2. Create Vercel Postgres Database
1. Go to [vercel.com](https://vercel.com) and sign in
2. Create new project → "Add Database" → "Create new PostgreSQL"
3. Database created, `.env.local` automatically added

### 3. Deploy to Vercel
1. Click "Deploy" (connects to your GitHub repo)
2. Accept all environment variables
3. Deploy!

### 4. Run Migrations & Seed
After deployment completes:
```bash
# Push schema to production database
vercel env pull
npx prisma migrate deploy

# Seed with demo data
npx prisma db seed
```

**Live URL:** Vercel provides `yourproject.vercel.app`

---

## **Option 2: Railway (Simple Alternative)**

### 1. Setup
1. Go to [railway.app](https://railway.app)
2. New Project → "Deploy from GitHub"
3. Select your repo

### 2. Add PostgreSQL
1. Click "+ Create" → PostgreSQL
2. Railway auto-fills `DATABASE_URL` in environment

### 3. Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

**Live URL:** Railway provides a public URL automatically

---

## **Option 3: Render (Another Good Option)**

### 1. Setup Database
1. Go to [render.com](https://render.com)
2. New PostgreSQL database
3. Copy connection string

### 2. Deploy Web Service
1. "New +" → "Web Service"
2. Connect GitHub repo
3. Set `DATABASE_URL` environment variable
4. Deploy!

---

## 🌱 **Database Seeding**

Your app already has seed data! Once deployed:

```bash
# Local development
npx prisma db seed

# Production (after Vercel/Railway deploy)
vercel env pull  # (Vercel only)
npx prisma db seed --skip-generate
```

**Seed includes:**
- 2 Warehouses (Mumbai, Bangalore)
- 2 Products (iPhone 15, MacBook Air)
- 4 Inventory records with stock

---

## ✅ **Quick Checklist**

- [ ] GitHub repo is public
- [ ] `.env.example` exists (for reviewers)
- [ ] `prisma/seed.ts` has demo data
- [ ] Database is seeded
- [ ] Live URL is working
- [ ] All API endpoints tested
- [ ] No hardcoded secrets in code

---

## 🔑 **Important Environment Variables**

```env
# Required
DATABASE_URL=postgresql://...

# Optional (for future features)
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://yourapp.vercel.app
```

**Never commit `.env` to Git!** Use `.env.example` instead.

---

## 📋 **Post-Deployment Testing**

Once live, test these endpoints:

```bash
# Get all products
curl https://yourapp.vercel.app/api/products

# Get all reservations
curl https://yourapp.vercel.app/api/reservations

# Create reservation (test with valid product + warehouse IDs)
curl -X POST https://yourapp.vercel.app/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "your-product-id",
    "warehouseId": "your-warehouse-id", 
    "quantity": 1
  }'
```

---

## 🆘 **Troubleshooting**

### "DATABASE_URL not found"
- Check environment variables in deployment dashboard
- Vercel: Settings → Environment Variables
- Railway: Variables in project settings

### "Prisma migrations failed"
```bash
# Reset and reseed
npx prisma migrate reset --force
npx prisma db seed
```

### "Port already in use"
Default port is 3000. Railway/Vercel handle this automatically.

---

## 📚 **Additional Resources**

- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)

