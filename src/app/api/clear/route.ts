import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const pendingReservations = await tx.reservation.findMany({
        where: {
          status: "PENDING",
        },
      });

      for (const reservation of pendingReservations) {
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
        });

        if (inventory) {
          await tx.inventory.update({
            where: {
              id: inventory.id,
            },
            data: {
              reservedQuantity: Math.max(
                0,
                inventory.reservedQuantity - reservation.quantity
              ),
            },
          });
        }
      }

      const updated = await tx.reservation.updateMany({
        where: {
          status: "PENDING",
        },
        data: {
          status: "RELEASED",
        },
      });

      return {
        message: `Cancelled ${updated.count} pending reservation(s)`,
        cancelledCount: updated.count,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
