# Inventory Reservation Platform

A modern backend-focused inventory management system demonstrating transactional database operations, reservation lifecycle management, and concurrency-safe stock handling using Next.js, Prisma ORM, and PostgreSQL.

## 🎯 Project Overview

This system simulates real-world e-commerce and warehouse management scenarios where customers temporarily reserve stock before confirming purchases. It ensures:

- **Accurate inventory handling** with atomic database transactions
- **Reservation expiry management** to prevent indefinite stock locks
- **Transactional consistency** across concurrent operations
- **Concurrency-safe stock reservation** preventing overselling
- **Complete reservation lifecycle** (PENDING → CONFIRMED/RELEASED/EXPIRED)

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- React 19

**Backend:**
- Next.js Route Handlers (API routes)
- Prisma ORM v6.19.3
- PostgreSQL (Neon)
- TypeScript

**Database:**
- PostgreSQL (Neon Cloud)
- Prisma Schema with migrations

## 📊 Database Design

### Core Models

#### Product
Represents sellable items in the inventory system.

#### Warehouse
Represents physical inventory locations.

#### Inventory
Junction table mapping products to warehouses with stock quantities.
- `totalQuantity`: Physical stock
- `reservedQuantity`: Locked for pending reservations
- `availableQuantity` = `totalQuantity - reservedQuantity` (calculated)

#### Reservation
Represents temporary stock reservations before purchase confirmation.

**Statuses:**
- `PENDING` - Newly created, awaiting confirmation (15-minute expiry)
- `CONFIRMED` - Stock purchased, inventory decremented
- `RELEASED` - Cancelled by user, reserved stock freed
- `EXPIRED` - Auto-expired after 15 minutes, reserved stock freed

## 🔌 API Endpoints

### 1. GET /api/products
Returns complete inventory status including available and reserved quantities.

```bash
curl http://localhost:3000/api/products
```

**Response:**
```json
[
  {
    "id": "product-id",
    "name": "iPhone 15",
    "inventories": [
      {
        "warehouseId": "warehouse-id",
        "warehouseName": "Mumbai Warehouse",
        "totalQuantity": 3,
        "reservedQuantity": 1,
        "availableQuantity": 2
      }
    ]
  }
]
```

### 2. POST /api/reservations
Creates a temporary stock reservation with automatic 15-minute expiry.

**Features:**
- Validates stock availability before reservation
- Uses Prisma transactions for atomicity
- Increments `reservedQuantity` automatically
- Sets 15-minute auto-expiry window
- Returns 409 Conflict if insufficient stock

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "warehouseId": "WAREHOUSE_ID",
    "quantity": 1
  }'
```

### 3. POST /api/reservations/[id]/confirm
Confirms a pending reservation and permanently decrements total inventory.

**Process:**
- Validates reservation is PENDING
- Checks reservation hasn't expired
- Atomically:
  - Decrements `totalQuantity` (actual sale)
  - Decrements `reservedQuantity` (removes hold)
  - Updates status to CONFIRMED

```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/confirm
```

### 4. POST /api/reservations/[id]/release
Cancels a pending reservation and frees reserved stock.

**Process:**
- Only allows cancelling PENDING reservations
- Prevents releasing CONFIRMED reservations
- Decrements `reservedQuantity` (frees the hold)
- Updates status to RELEASED

```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/release
```

### 5. POST /api/cleanup
Automated cleanup endpoint for expired reservations. Call periodically via cron job or scheduler.

**Process:**
- Finds all PENDING reservations past expiry time
- Decrements `reservedQuantity` for each
- Updates status to EXPIRED
- Uses transaction for consistency

```bash
curl -X POST http://localhost:3000/api/cleanup
```

## 🔄 Reservation Workflow

1. **Check Inventory** → `GET /api/products`
2. **Create Reservation** → `POST /api/reservations` (15-min timer starts)
3. **Confirm or Release** (Before Expiry):
   - `POST /api/reservations/{id}/confirm` - Complete purchase
   - `POST /api/reservations/{id}/release` - Cancel reservation
4. **Auto-Cleanup** (If Not Confirmed) → `POST /api/cleanup`

**Inventory State Example:**

```
Before: iPhone 15 at Mumbai
├─ Total: 3, Reserved: 0, Available: 3

After Reservation (quantity=1):
├─ Total: 3, Reserved: 1, Available: 2

After Confirmation:
├─ Total: 2, Reserved: 0, Available: 2
```

## 🔐 Concurrency & Transaction Safety

All critical operations use `prisma.$transaction()` for atomicity:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // All these operations succeed or fail together
  const inventory = await tx.inventory.findUnique(...);
  await tx.inventory.update(...);
  const reservation = await tx.reservation.update(...);
  return reservation;
});
```

This ensures:
- Database sees changes as single atomic operation
- Read-then-update is consistent
- No dirty reads or phantom records
- Automatic rollback on errors
- Prevents double-booking and negative inventory

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon or local)
- Environment variables configured

### Installation

```bash
# Install dependencies
npm install

# Configure environment
# Add DATABASE_URL to .env file

# Setup database
npx prisma migrate dev

# Seed sample data
npx prisma db seed
```

### Development

```bash
npm run dev
# Visit http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## ✅ Features Implemented

- ✅ Inventory Management API with warehouse-specific quantities
- ✅ Reservation System with 15-minute auto-expiry
- ✅ Transaction-based operations for consistency
- ✅ Confirmation Flow with permanent inventory deduction
- ✅ Release/Cancel for pending reservations
- ✅ Expiry Cleanup endpoint
- ✅ Interactive Frontend with Real-time inventory display
- ✅ Reserve/Confirm/Release UI buttons
- ✅ Full TypeScript type safety
- ✅ Proper error handling and validation

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Frontend UI
│   └── api/
│       ├── products/route.ts       # GET products
│       ├── reservations/route.ts   # POST create
│       ├── reservations/[id]/
│       │   ├── confirm/route.ts    # POST confirm
│       │   └── release/route.ts    # POST release
│       └── cleanup/route.ts        # POST cleanup
└── lib/
    └── prisma.ts                   # Prisma client

prisma/
├── schema.prisma                   # Database schema
├── seed.ts                         # Sample data
└── migrations/                     # Database migrations
```

## 🧪 Testing the System

### Interactive Frontend
Visit [http://localhost:3000](http://localhost:3000) to:
- View inventory across warehouses
- Reserve products with quantity
- Confirm pending reservations
- Cancel/release reservations
- See real-time inventory updates

### cURL Commands

**1. View Inventory**
```bash
curl http://localhost:3000/api/products
```

**2. Create Reservation**
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-id",
    "warehouseId": "warehouse-id",
    "quantity": 1
  }'
```

**3. Confirm Reservation**
```bash
curl -X POST http://localhost:3000/api/reservations/reservation-id/confirm
```

**4. Release Reservation**
```bash
curl -X POST http://localhost:3000/api/reservations/reservation-id/release
```

**5. Cleanup Expired**
```bash
curl -X POST http://localhost:3000/api/cleanup
```

## 🌍 Real-World Applications

Patterns used by:
- **Amazon** - Item reservations during checkout
- **Flipkart** - Temporary stock holds
- **Shopify** - Inventory management
- **Warehouse Management Systems** - Stock allocation
- **Hotel Booking** - Room reservations
- **Flight Booking** - Seat holds

## 🔒 Error Handling

| Status | Scenario | Error Message |
|--------|----------|---------------|
| 409 | Stock unavailable | "Insufficient stock" |
| 404 | Not found | "Reservation not found" |
| 400 | Already processed | "Reservation already processed" |
| 410 | Expired | "Reservation expired" |
| 400 | Invalid input | "Missing required fields" |

## 📚 Learning Outcomes

This project demonstrates:
1. Backend System Design and REST API architecture
2. Database Transactions and ACID compliance
3. Concurrency Handling and race condition prevention
4. Inventory Management logic and lifecycle
5. API Design best practices
6. Prisma ORM patterns and usage
7. TypeScript type safety
8. Full-stack Frontend-Backend integration

## 🚀 Deployment

Ready for deployment to:
- **Vercel** - Recommended for Next.js
- **AWS Lambda** - Via Vercel or direct
- **Docker** - Containerized deployment
- **Traditional Servers** - Node.js hosting

### Deploy to Vercel

```bash
npm install -g vercel
vercel
# Follow prompts to connect GitHub and deploy
```

## 📝 Future Enhancements

- Row-level database locking with `SELECT FOR UPDATE`
- Scheduled cron jobs for automatic expiry cleanup
- WebSocket support for real-time updates
- Admin dashboard for reservation monitoring
- Inventory analytics and reporting
- Multi-warehouse transfers
- Email notifications for reservation expiry

## 📧 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ using Next.js 16, Prisma ORM, and PostgreSQL**
