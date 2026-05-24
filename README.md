# Inventory Reservation Platform

A real-time inventory management system demonstrating transactional database operations, reservation lifecycle management, and concurrency-safe stock handling.

**🔗 Live Link**: [https://inventory-reservation-platform.vercel.app/](https://inventory-reservation-platform.vercel.app/)

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (React 19) + Tailwind CSS + shadcn/ui
- **Backend**: Next.js Route Handlers (stateless REST APIs)
- **Database**: PostgreSQL (Prisma ORM)

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/venkatkollu/Inventory-reservation-platform.git
cd inventory-reservation-platform
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_platform"
```

### 3. Setup Database
Run migrations and seed the database with initial products, warehouses, and inventory:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 📡 API Endpoints

- **`GET /api/products`**: Fetch products and their available inventory across warehouses.
- **`GET /api/reservations`**: Fetch all reservations.
- **`POST /api/reservations`**: Create a temporary stock reservation (expires in 15 minutes).
- **`POST /api/reservations/[id]/confirm`**: Permanently deduct inventory and confirm purchase.
- **`POST /api/reservations/[id]/release`**: Manually release reservation hold back to inventory.
- **`POST /api/cleanup`**: Cron/manual endpoint to reclaim expired pending reservations.
- **`POST /api/clear`**: Force-cancel all pending reservations.

---

## ⏱️ Expiry Mechanism in Production

1. **TTL Timestamp**: When a user creates a reservation, a `PENDING` record is saved with `expiresAt` set to 15 minutes in the future, and the inventory's `reservedQuantity` is increased.
2. **Periodic Cleanup**: A serverless cron job (e.g., Vercel Cron, AWS CloudWatch, or a node cron utility) should trigger a `POST` request to `/api/cleanup` every 5 minutes.
3. **Reclaim Logic**: The `/api/cleanup` endpoint performs a transactional database sweep:
   - Queries all reservations where `status = "PENDING"` and `expiresAt < now`.
   - Decrements the `reservedQuantity` in `Inventory` for each expired item.
   - Marks the reservation statuses as `EXPIRED`.

---

## ⚖️ Trade-offs & Future Improvements

- **Serializable Transactions**: To guarantee absolute stock safety (preventing overselling under high concurrency), we use Prisma's `$transaction` with `Serializable` isolation level. 
  - *Trade-off*: Higher database lock contention under extreme loads. 
  - *Alternative*: With more time, we could implement **optimistic concurrency control** (using a version/epoch column in `Inventory`) or coordinate locks at the application level using **Redis / Redlock** to achieve higher write throughput.
- **Cron vs Event-Driven Cleanup**: The current cron-based cleanup means a slot might remain locked for up to an additional 5 minutes after it technically expires.
  - *Alternative*: Under higher scale, we could leverage an event queue (e.g., BullMQ or AWS SQS delayed messages) or **Redis Keyspace Notifications** to release reservation holds instantly upon expiration.
- **Audit Trails**: Currently, physical inventory changes are made directly. For a full-scale warehouse system, we would introduce a secondary `AuditLog` table to record every increment/decrement with user attributes for auditability.

---

## ☁️ Vercel Deployment & Seeding

When deploying to Vercel, your live database starts empty. To set up tables and populate seed data:

1. **Link Vercel & Pull Env Vars**:
   Run these commands from your local project folder to link to Vercel and pull your live `DATABASE_URL`:
   ```bash
   npm install -g vercel
   vercel link
   vercel env pull .env.local
   ```
2. **Apply Migrations & Seed**:
   Copy the live `DATABASE_URL` from `.env.local` to your `.env` file, then run:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
3. **Automate Migrations (Optional)**:
   In Vercel Dashboard → **Settings** → **Build & Development Settings**, set the **Build Command** to:
   ```bash
   npx prisma generate && npx prisma migrate deploy && next build
   ```


