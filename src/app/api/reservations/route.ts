import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    include: {
      product: true,
      warehouse: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  try {
    const { productId, warehouseId, quantity } = await req.json();

    // Validate input
    if (!productId || !warehouseId || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: productId, warehouseId, quantity" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      const availableQuantity =
        inventory.totalQuantity - inventory.reservedQuantity;

      if (availableQuantity < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${Math.max(0, availableQuantity)}, Requested: ${quantity}`
        );
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const reservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: "PENDING",
          expiresAt,
        },
      });

      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
        data: {
          reservedQuantity: {
            increment: quantity,
          },
        },
      });

      return reservation;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Internal server error";

    if (message.includes("Insufficient stock")) {
      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    if (message.includes("Inventory not found")) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
