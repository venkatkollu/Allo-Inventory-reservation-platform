# Inventory Reservation Platform

A production-grade inventory management system demonstrating transactional database operations, reservation lifecycle management, and concurrency-safe stock handling. Built with Next.js 16, Prisma ORM, and PostgreSQL to showcase backend engineering best practices.

## 🌐 Live Demo & Deployment

- **Live URL**: [Add your deployment URL here]
- **GitHub Repo**: [This repository](https://github.com/venkatkollu/Inventory-reservation-platform)
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Production Deployment](#production-deployment)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)

---

## 🎯 Overview

This system implements a scalable inventory reservation pattern used by e-commerce platforms (Amazon, Flipkart, Shopify) where customers temporarily reserve stock before checkout completion. It demonstrates enterprise-grade concerns:

**Core Features:**
- ✅ **ACID Transactions**: Atomic operations preventing race conditions and overselling
- ✅ **Automatic Expiry**: Time-based TTL (15 minutes) with periodic cleanup
- ✅ **Concurrency Control**: SERIALIZABLE isolation preventing double-booking
- ✅ **Multi-Warehouse**: Distributed inventory across locations
- ✅ **Type Safety**: Full TypeScript with strict mode
- ✅ **Scalable Architecture**: Stateless APIs suitable for horizontal scaling

**Real-World Applications:**
- **E-commerce**: Item reservations during checkout (Amazon, Flipkart)
- **Inventory Systems**: Stock allocation and transfers
- **Hotel/Flight Booking**: Room/seat reservations with TTL
- **Restaurant Reservations**: Table holds with expiry

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.17+ (LTS recommended)
- **npm**: 9+ (or yarn/pnpm)
- **PostgreSQL**: 14+ or Neon Cloud account
- **Git**: Version control

### 1. Clone & Install

```bash
git clone https://github.com/venkatkollu/Inventory-reservation-platform.git
cd inventory-reservation-platform
npm install
```

### 2. Environment Configuration

Create `.env` file in project root:

```env
# PostgreSQL Connection String
# For Neon Cloud: postgresql://user:password@ep-xxx.region.aws.neon.tech/database?sslmode=require
# For Local: postgresql://postgres:password@localhost:5432/inventory_platform
DATABASE_URL="postgresql://user:password@localhost:5432/inventory_platform"

# Optional: Prisma logging for debugging
DATABASE_LOG_LEVEL="info"
```

**Getting Your Database URL:**

**Option A: Neon Cloud (Recommended for Production)**
1. Sign up at https://neon.tech
2. Create new project
3. Copy connection string from Console
4. Add `?sslmode=require` to enable SSL

**Option B: Local PostgreSQL**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Windows: Download from https://www.postgresql.org/download/windows/

# Create database
createdb inventory_platform
```

### 3. Database Setup

```bash
# Run migrations (creates schema)
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed

# View data in browser UI
npx prisma studio
# Opens http://localhost:5555
```

**Database Seeded With:**
- 2 Warehouses: Mumbai, Bangalore
- 2 Products: iPhone 15, MacBook Air
- 6 Inventory records with realistic stock levels

### 4. Start Development Server

```bash
npm run dev
# Listening on http://localhost:3000
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (while running `npx prisma studio`)

---

## 🏗️ System Architecture

### Technology Stack

| Component | Technology | Why Chosen |
|-----------|-----------|-----------|
| **Frontend** | React 19 + Next.js 16 | Server & client in one, fast iteration |
| **Backend** | Next.js Route Handlers | Serverless-friendly, TypeScript-first |
| **ORM** | Prisma 6.19.3 | Type-safe, migration management, transactions |
| **Database** | PostgreSQL 14+ | ACID compliant, perfect for critical data |
| **Deployment** | Vercel + Neon | Seamless Next.js integration, managed DB |

### Architecture Diagram

```
┌────────────────────────────────────────────────┐
│          Browser (React Component)             │
│   - Displays inventory across warehouses      │
│   - Manages reservation lifecycle             │
│   - Real-time updates after actions           │
└──────────────────────┬─────────────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │    Next.js API Routes (Backend)     │
    │  • GET  /api/products               │
    │  • POST /api/reservations           │
    │  • POST /api/reservations/[id]/conf │
    │  • POST /api/reservations/[id]/rel  │
    │  • POST /api/cleanup                │
    └──────────────────┬──────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │    Prisma ORM (Data Access Layer)   │
    │  - Handles transactions             │
    │  - Type-safe queries                │
    │  - Migration management             │
    └──────────────────┬──────────────────┘
                       │
    ┌──────────────────▼──────────────────┐
    │   PostgreSQL (Transactional DB)     │
    │  • Products (SKUs)                  │
    │  • Warehouses (Locations)           │
    │  • Inventory (Stock ledger)         │
    │  • Reservations (Holds/PENDING)     │
    └────────────────────────────────────┘
```

### Data Flow: Create Reservation

```
1. User selects product quantity
   └─→ Frontend POST /api/reservations

2. Backend checks stock (in transaction)
   ├─ Query: current inventory
   ├─ Validate: availableQuantity >= requested
   └─ If invalid: return 409 Conflict

3. Reserve stock (atomic)
   ├─ Increment reservedQuantity
   ├─ Create Reservation (PENDING status)
   ├─ Set expiresAt = now + 15 minutes
   └─ Commit transaction (all or nothing)

4. Frontend receives reservation ID
   ├─ Refresh inventory display
   ├─ Show "Confirm/Release" buttons
   └─ Display countdown: "Expires in 14:59..."

5. User action (before expiry)
   ├─ CONFIRM: decrement totalQuantity (final sale)
   └─ RELEASE: decrement reservedQuantity (cancel)

6. Auto-cleanup (every 5 minutes)
   ├─ Query expired PENDING reservations
   ├─ Decrement reservedQuantity for each
   └─ Update status to EXPIRED
```

---

## 📊 Database Design

### Core Models

```prisma
model Product {
  id            String        @id @default(cuid())
  name          String        // Product name/SKU
  inventories   Inventory[]   // One-to-many
  reservations  Reservation[] // One-to-many
  createdAt     DateTime      @default(now())
}

model Warehouse {
  id            String        @id @default(cuid())
  name          String        // Location (Mumbai, Bangalore, etc.)
  inventories   Inventory[]   // One-to-many
  reservations  Reservation[] // One-to-many
}

model Inventory {
  id                String    @id @default(cuid())
  productId         String    // Foreign key
  warehouseId       String    // Foreign key
  totalQuantity     Int       // Physical stock (what's in warehouse)
  reservedQuantity  Int       // Locked for pending reservations
  
  // Calculated field (not stored):
  // availableQuantity = totalQuantity - reservedQuantity
  
  @@unique([productId, warehouseId]) // One inventory per product-warehouse pair
  @@index([productId])
  @@index([warehouseId])
}

model Reservation {
  id            String              @id @default(cuid())
  productId     String              // Foreign key
  warehouseId   String              // Foreign key
  quantity      Int                 // Units reserved
  status        ReservationStatus   // State enum
  expiresAt     DateTime            // TTL timestamp
  createdAt     DateTime            @default(now())
  
  @@index([status])
  @@index([expiresAt])
  @@index([status, expiresAt]) // Composite for cleanup query
}

enum ReservationStatus {
  PENDING     // Awaiting confirmation (max 15 min)
  CONFIRMED   // Sold, inventory decremented
  RELEASED    // Cancelled by user
  EXPIRED     // Auto-expired after TTL
}
```

### Inventory Calculation

```typescript
// Frontend calculates available stock for display:
availableQuantity = totalQuantity - reservedQuantity;

// Example:
{
  totalQuantity: 10,      // Physical inventory in warehouse
  reservedQuantity: 3,    // Held for pending orders
  availableQuantity: 7    // Show to customers: "7 in stock"
}
```

### Reservation State Machine

```
                 ┌─────────────┐
                 │   PENDING   │ ← Initial state
                 │ (TTL: 15m)  │   expiresAt set
                 └──┬──────┬───┘
         ╔──────────┘      └──────────╗
         │                           │
         ▼                           ▼
    ┌────────────┐         ┌──────────────┐
    │ CONFIRMED  │         │  RELEASED    │
    │ (Purchased)│         │ (Cancelled)  │
    └────────────┘         └──────────────┘
         │                           │
         └──────────────┬────────────┘
                        │
                        ▼ (manual cleanup needed)
                   ┌─────────────┐
                   │  EXPIRED    │ ← Auto-cleanup
                   │ (TTL passed)│   reservedQty freed
                   └─────────────┘

Manual Release:
  PENDING → RELEASED: decrement reservedQuantity

Auto Expiry (every 5 min cleanup):
  PENDING (expiresAt < now) → EXPIRED: decrement reservedQuantity
```

---

## 📡 API Documentation

### 1. GET /api/products

Returns complete inventory status across all warehouses.

**Request:**
```bash
curl http://localhost:3000/api/products
```

**Response:**
```json
[
  {
    "id": "product-123",
    "name": "iPhone 15",
    "inventories": [
      {
        "warehouseId": "warehouse-1",
        "warehouseName": "Mumbai",
        "totalQuantity": 10,
        "reservedQuantity": 3,
        "availableQuantity": 7
      },
      {
        "warehouseId": "warehouse-2",
        "warehouseName": "Bangalore",
        "totalQuantity": 5,
        "reservedQuantity": 1,
        "availableQuantity": 4
      }
    ]
  }
]
```

---

### 2. POST /api/reservations

Creates a 15-minute stock reservation.

**Request:**
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-123",
    "warehouseId": "warehouse-1",
    "quantity": 2
  }'
```

**Success Response (200):**
```json
{
  "id": "reservation-456",
  "productId": "product-123",
  "warehouseId": "warehouse-1",
  "quantity": 2,
  "status": "PENDING",
  "expiresAt": "2026-05-24T05:46:43.708Z",
  "createdAt": "2026-05-24T05:31:43.712Z"
}
```

**Error Response (409 - Insufficient Stock):**
```json
{
  "error": "Insufficient stock available"
}
```

**Transactional Guarantees:**
- ✅ Atomically checks and reserves stock
- ✅ Prevents overselling even under concurrent load
- ✅ Increments `reservedQuantity` in same transaction
- ✅ If fails, entire transaction rolls back

---

### 3. POST /api/reservations/[id]/confirm

Confirms reservation, permanently reducing inventory.

**Request:**
```bash
curl -X POST http://localhost:3000/api/reservations/reservation-456/confirm
```

**Response:**
```json
{
  "id": "reservation-456",
  "status": "CONFIRMED",
  "productId": "product-123",
  "quantity": 2
}
```

**What Happens in Database:**
```sql
BEGIN TRANSACTION;
  -- Verify reservation is PENDING and not expired
  SELECT * FROM reservations WHERE id = 'reservation-456' AND status = 'PENDING';
  
  -- Decrement physical inventory (FINAL SALE)
  UPDATE inventory 
    SET total_quantity = total_quantity - 2
    WHERE product_id = 'product-123' AND warehouse_id = 'warehouse-1';
  
  -- Remove from hold
  UPDATE inventory
    SET reserved_quantity = reserved_quantity - 2
    WHERE product_id = 'product-123' AND warehouse_id = 'warehouse-1';
  
  -- Mark reservation complete
  UPDATE reservations
    SET status = 'CONFIRMED'
    WHERE id = 'reservation-456';
COMMIT;
```

---

### 4. POST /api/reservations/[id]/release

Cancels a pending reservation, freeing stock.

**Request:**
```bash
curl -X POST http://localhost:3000/api/reservations/reservation-456/release
```

**Response:**
```json
{
  "id": "reservation-456",
  "status": "RELEASED",
  "quantity": 2
}
```

**Inventory Effect:**
- Only decrements `reservedQuantity` (stock becomes available again)
- Does NOT decrement `totalQuantity` (nothing was sold)
- Stock is freed for other customers

---

### 5. POST /api/cleanup

Automated cleanup of expired reservations. **Call via cron job every 5 minutes in production.**

**Request:**
```bash
curl -X POST http://localhost:3000/api/cleanup
```

**Response:**
```json
{
  "expiredCount": 5,
  "freed": 12,
  "message": "Cleaned up 5 expired reservations, freed 12 units"
}
```

**Queries Expired Reservations:**
```sql
SELECT * FROM reservations
WHERE status = 'PENDING' AND expires_at <= NOW()
LIMIT 1000;
```

**For Each Expired Reservation:**
1. Decrement `reservedQuantity` (frees stock)
2. Update status to `EXPIRED`
3. Use transaction for consistency

---

## 🌍 Production Deployment

### Reservation Expiry Mechanism

#### How It Works

The expiry system uses **time-based TTL** with periodic cleanup:

**Timeline:**
```
T=0min     → User creates reservation
            expiresAt = current_time + 15 minutes
            reservedQuantity incremented
            
T=0-15min  → Reservation is PENDING
            User can CONFIRM or RELEASE
            
T=15min    → Cleanup cron job runs
            Query: reservations where status='PENDING' AND expiresAt <= NOW()
            For each: decrement reservedQuantity, set status='EXPIRED'
```

#### Architecture in Production

```
┌─ User Creates Reservation ──────┐
│ expiresAt = NOW() + 15 minutes  │
│ status = PENDING                │
└──────────────┬──────────────────┘
               │
      ┌────────▼────────┐
      │   15 minutes    │
      │     elapse      │
      └────────┬────────┘
               │
    ┌──────────▼──────────────────┐
    │ Cron Job Runs (every 5 min) │
    │ - Find expired reservations │
    │ - Decrement reservedQty     │
    │ - Mark as EXPIRED           │
    └─────────────────────────────┘
```

#### Cron Job Setup Options

**Option 1: AWS CloudWatch Rules (Recommended)**
```
Rule Name: inventory-cleanup
Schedule: rate(5 minutes)
Target: HTTPS POST to /api/cleanup
Timeout: 30 seconds
Max retry attempts: 2
Dead letter queue: SNS topic
```

**Option 2: Node.js node-cron (Self-hosted)**
```typescript
import cron from 'node-cron';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/cleanup', {
      method: 'POST',
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`Cleanup failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✓ Cleanup succeeded: ${result.expiredCount} expired`);
    
  } catch (error) {
    console.error('✗ Cleanup failed:', error);
    // Send alert to monitoring service
    alerting.sendAlert({
      service: 'inventory-cleanup',
      severity: 'high',
      error: error.message
    });
  }
});
```

**Option 3: External Service (EasyCron, Zapier)**
- Visit https://www.easycron.com
- Create cron job: POST http://your-domain/api/cleanup
- Frequency: Every 5 minutes
- Notifications on failure

#### Failure Scenarios & Recovery

| Scenario | Impact | Recovery |
|----------|--------|----------|
| Cleanup job fails | Stock locked temporarily | Next cleanup cycle handles it |
| Database down | Cleanup can't run | Stock remains locked until DB recovers |
| High cleanup latency | Inventory queries slow | Add index on (status, expiresAt) |
| Distributed cleanup race | Duplicate processing | Add `SELECT FOR UPDATE` lock |

#### Scaling Cleanup

```sql
-- For high volume (1M+ expired/day):
-- Use batch delete with pagination instead of per-record updates

WITH expired AS (
  SELECT id FROM reservations
  WHERE status = 'PENDING' AND expires_at <= NOW()
  LIMIT 1000
  FOR UPDATE
)
UPDATE inventory SET reserved_quantity = reserved_quantity - (
  SELECT SUM(quantity) FROM reservations WHERE id IN (SELECT id FROM expired)
);

UPDATE reservations SET status = 'EXPIRED'
WHERE id IN (SELECT id FROM expired);
```

### Database Indexing for Performance

```sql
-- Critical index for cleanup queries
CREATE INDEX idx_reservations_pending_expired 
  ON reservations(status, expires_at) 
  WHERE status = 'PENDING';

-- Inventory lookups
CREATE INDEX idx_inventory_product_warehouse 
  ON inventory(product_id, warehouse_id);

-- Reservation tracking
CREATE INDEX idx_reservations_product_warehouse 
  ON reservations(product_id, warehouse_id);

-- Verify indexes are being used
EXPLAIN ANALYZE
SELECT * FROM reservations
WHERE status = 'PENDING' AND expires_at <= NOW();
```

### Monitoring & Observability

**Key Metrics:**
```typescript
// Track these in your monitoring service (DataDog, New Relic, etc.)

metrics.gauge('inventory.reservations.pending', pendingCount);
metrics.gauge('inventory.cleanup.duration_ms', cleanupDuration);
metrics.counter('inventory.reservations.created', 1, ['warehouse:mumbai']);
metrics.counter('inventory.reservations.confirmed', 1);
metrics.counter('inventory.reservations.released', 1);
metrics.counter('inventory.cleanup.expired', expiredCount);

// Alerts
alert.if(cleanupDuration > 10000, 'Cleanup slow: > 10 seconds');
alert.if(pendingCount > 10000, 'High pending reservations');
alert.if(reservationSuccessRate < 0.95, 'High failure rate');
```

### Deployment to Vercel + Neon / Railway / Render

**👉 See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step guide with:**
- ✅ Vercel + Vercel Postgres (recommended, 5 min)
- ✅ Railway (simple alternative)
- ✅ Render (another option)
- ✅ Database seeding instructions
- ✅ Post-deployment testing

**Quick deployment summary:**
```bash
# Push to GitHub
git push origin main

# Deploy with one of these:
# 1. Vercel: vercel deploy --prod
# 2. Railway: railway up
# 3. Render: Connect GitHub repo in dashboard

# Seed database with demo data
npx prisma db seed
```

---

## 🏛️ Design Decisions & Trade-offs

### Decision 1: Time-Based Expiry with Periodic Cleanup

**What We Chose:**
```
15-minute TTL + cron job cleanup every 5 minutes
```

**Why This Over Alternatives:**

| Approach | Pros | Cons | Choice |
|----------|------|------|--------|
| **Time-Based (Chosen)** | Simple, reliable, no external deps | Stock locked briefly after expiry | ✅ |
| **Event-Based** | Immediate cleanup | Needs message queue (Kafka, RabbitMQ) | ❌ |
| **Redis TTL** | Nanosecond precision | Another service to manage | ❌ |
| **Database TTL** | Native, no code | PostgreSQL doesn't support auto-delete | ❌ |

**Production Implications:**
- Stock may be locked for up to 5 minutes after expiry
- Acceptable for e-commerce (vs. hotel booking requiring immediate release)
- Can reduce cleanup frequency if acceptable

---

### Decision 2: Dual Quantity Tracking

**Architecture:**
```typescript
totalQuantity    = physical stock in warehouse
reservedQuantity = locked for pending reservations
availableQuantity = totalQuantity - reservedQuantity (calculated)
```

**Why Not Single Quantity?**

| Approach | Scenario | Result |
|----------|----------|--------|
| **Single Qty (Bad)** | Customer reserves, then releases | Qty increases (confusing to audit) |
| **Dual Qty (Good)** | Customer reserves, then releases | Reserved decreases, Total unchanged |

**Benefit:** Clear audit trail showing what's actually sold vs. held

---

### Decision 3: SERIALIZABLE Transaction Isolation

**The Problem:**
```
Race Condition Scenario:
Customer A: Check stock (5 available) ✓
Customer B: Check stock (5 available) ✓
Customer A: Reserve 5 units → Success
Customer B: Reserve 5 units → Should FAIL (oversell!)
```

**Solution Used:**
```typescript
await prisma.$transaction(
  async (tx) => {
    // All operations are serializable
  },
  { isolationLevel: 'Serializable' }
);
```

**Trade-off: Performance vs. Safety**
```
Isolation Level     | Safety | Throughput | Best For
─────────────────────────────────────────────────────
READ_UNCOMMITTED    | ❌❌   | ⭐⭐⭐    | Cache/logs
READ_COMMITTED      | ⚠️    | ⭐⭐     | Web apps
REPEATABLE_READ     | ✅    | ⭐       | Banking  
SERIALIZABLE(used)  | ✅✅  | ⭐       | Critical data
```

**Decision Rationale:**
- Inventory accuracy > transaction throughput
- Overselling costs more than slower queries
- E-commerce can handle 5-second latency

---

### Decision 4: Stateless API Design

**Why No Session State?**
```
✅ Horizontal scaling (10 servers = 10x capacity)
✅ Serverless-friendly (Vercel, Lambda)
✅ No session replication needed
✅ Simple deployment

❌ Clients must track reservation IDs
❌ No built-in cart persistence
❌ No session-based auth (need JWT/OAuth)
```

**For Production:**
```typescript
// Would add JWT for authentication:
const token = jwt.sign({ userId: '123' }, SECRET);

// Then verify in each request:
const userId = jwt.verify(token, SECRET);
```

---

### Decision 5: Frontend State Management

**Chose:** Local state + fetch hooks
```typescript
const [products, setProducts] = useState([]);
const [reservations, setReservations] = useState([]);

// Refresh after mutations
await Promise.all([fetchProducts(), fetchReservations()]);
```

**Why Not Redux/Zustand?**
- ✅ No external dependencies
- ✅ Fast initial load
- ✅ Easy to understand
- ❌ Multiple fetches per action
- ❌ Scales poorly (100+ components)

**Production Upgrade:**
```typescript
// Use React Query for caching
const { data: products } = useQuery(['products'], fetchProducts, {
  staleTime: 30000,      // 30 sec
  cacheTime: 5 * 60000,  // 5 min
  refetchInterval: 60000 // Auto-refresh
});
```

---

### Decision 6: Database Choice: PostgreSQL

**Comparison:**

| Feature | PostgreSQL | MongoDB |
|---------|-----------|---------|
| ACID Compliance | ✅ Full | ⚠️ Document-level |
| Complex Queries | ✅ JOINs, aggregations | ❌ Embedded, limited |
| Schema Validation | ✅ Type-safe | ❌ Flexible (risky) |
| Transactions | ✅ Multi-table | ⚠️ Limited |
| Scaling | ⚠️ Vertical (Read replicas) | ✅ Horizontal sharding |

**Why PostgreSQL?**
- Inventory = financial data = needs ACID
- Complex Product-Warehouse-Inventory relationships
- Schema prevents data corruption
- Perfect consistency > eventual consistency

---

## 📈 If I Had More Time...

### Improvements to Implement:

**1. Redis Caching Layer**
```typescript
// Cache products for 30 seconds
const cached = await redis.get('products');
if (cached) return JSON.parse(cached);

const products = await db.query(...);
await redis.set('products', JSON.stringify(products), 'EX', 30);
```

**2. Connection Pooling**
```typescript
// Current: Each serverless function = new connection
// Better: Use PgBouncer for connection reuse
// PgBouncer: max 1000 concurrent, 100 per client
```

**3. Database Sharding**
```
Shard by Warehouse:
├─ Node 1: Mumbai warehouse inventory
├─ Node 2: Bangalore warehouse inventory
└─ Global: Product catalog (replicated)

Benefit: Parallel cleanup jobs, no contention
```

**4. Advanced Monitoring**
```typescript
// Add to every operation:
import { prometheus } from 'prometheus-client';

const duration = prometheus.histogram('db_query_duration_ms');
const timer = duration.startTimer();
await db.query(...);
timer(); // Records duration
```

**5. Testing Suite**
```typescript
// Unit tests for state machine
// Integration tests for API endpoints
// Load testing for cleanup job at 1M+ reservations
// Chaos testing (kill DB, restart cleanup job, etc.)
```

**6. API Rate Limiting**
```typescript
// Prevent abuse:
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60000,     // 1 minute
  max: 100,            // 100 requests per minute
  keyGenerator: (req) => req.headers['x-forwarded-for']
});

app.use('/api/', limiter);
```

**7. Audit Logging**
```typescript
// Track all inventory changes:
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50), -- 'RESERVE', 'CONFIRM', 'RELEASE', 'EXPIRE'
  reservation_id UUID,
  inventory_id UUID,
  quantity_change INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**8. Admin Dashboard**
```typescript
// View real-time:
// - Pending reservations by age
// - Failed operations (errors)
// - Inventory discrepancies
// - Cleanup job status
// - Performance metrics
```

---

## 🧪 Testing & Verification

### Manual Testing (Postman/cURL)

```bash
# 1. View inventory
curl http://localhost:3000/api/products

# 2. Create reservation
RESERVATION_ID=$(curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"xxx","warehouseId":"yyy","quantity":1}' | jq -r '.id')

# 3. Confirm reservation
curl -X POST http://localhost:3000/api/reservations/$RESERVATION_ID/confirm

# 4. Verify inventory decreased
curl http://localhost:3000/api/products
```

### Automated Tests (Jest)

```typescript
describe('Reservation API', () => {
  it('should prevent overselling', async () => {
    const res = await fetch('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'p1',
        warehouseId: 'w1',
        quantity: 1000 // More than available
      })
    });
    expect(res.status).toBe(409);
  });

  it('should confirm and decrement inventory', async () => {
    // Create reservation
    // Confirm it
    // Check inventory decreased
    // Check reservation marked CONFIRMED
  });
});
```

---

## 📞 Support & Questions

For issues or questions:
1. Check [GitHub Issues](https://github.com/venkatkollu/Inventory-reservation-platform/issues)
2. Review code comments in route handlers
3. Check Prisma [documentation](https://www.prisma.io/docs/)
4. Consult [PostgreSQL docs](https://www.postgresql.org/docs/)

---

## 📄 License

MIT License - Feel free to use for learning and projects.

---

**Built with ❤️ using Next.js 16, Prisma, and PostgreSQL**

**Last Updated:** May 24, 2026
