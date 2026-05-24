import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Products ===");
  const products = await prisma.product.findMany({
    include: {
      inventories: {
        include: { warehouse: true },
      },
      reservations: true,
    },
  });
  console.dir(products, { depth: 4 });

  console.log("=== Inventories ===");
  const inventories = await prisma.inventory.findMany({
    include: {
      product: true,
      warehouse: true,
    },
  });
  console.dir(inventories, { depth: 4 });

  console.log("=== Reservations ===");
  const reservations = await prisma.reservation.findMany({
    include: {
      product: true,
      warehouse: true,
    },
  });
  console.dir(reservations, { depth: 4 });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
