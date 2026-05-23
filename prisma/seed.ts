import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: "Mumbai Warehouse",
    },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
    },
  });

  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15",
    },
  });

  const macbook = await prisma.product.create({
    data: {
      name: "MacBook Air",
    },
  });

  await prisma.inventory.createMany({
    data: [
      {
        productId: iphone.id,
        warehouseId: warehouse1.id,
        totalQuantity: 3,
      },
      {
        productId: iphone.id,
        warehouseId: warehouse2.id,
        totalQuantity: 2,
      },
      {
        productId: macbook.id,
        warehouseId: warehouse1.id,
        totalQuantity: 1,
      },
    ],
  });

  console.log("Seed data created");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });