import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  const formattedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    inventories: product.inventories.map((inventory) => ({
      warehouseId: inventory.warehouse.id,
      warehouseName: inventory.warehouse.name,
      totalQuantity: inventory.totalQuantity,
      reservedQuantity: inventory.reservedQuantity,
      availableQuantity: Math.max(
        0,
        inventory.totalQuantity - inventory.reservedQuantity
      ),
    })),
  }));

  return NextResponse.json(formattedProducts);
}