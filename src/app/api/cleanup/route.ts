import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find all expired PENDING reservations
      const expiredReservations = await tx.reservation.findMany({
        where: {
          status: "PENDING",
          expiresAt: {
            lt: new Date(), // Less than (older than) now
          },
        },
      });

      if (expiredReservations.length === 0) {
        return {
          message: "No expired reservations found",
          cleanedCount: 0,
        };
      }

      // For each expired reservation, decrement the reserved quantity safely
      for (const reservation of expiredReservations) {
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
        });

        if (inventory) {
          const newReserved = Math.max(
            0,
            inventory.reservedQuantity - reservation.quantity
          );

          await tx.inventory.update({
            where: {
              id: inventory.id,
            },
            data: {
              reservedQuantity: newReserved,
            },
          });
        }
      }

      // Update all expired reservations to EXPIRED status
      await tx.reservation.updateMany({
        where: {
          status: "PENDING",
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: "EXPIRED",
        },
      });

      return {
        message: `Cleaned up ${expiredReservations.length} expired reservation(s)`,
        cleanedCount: expiredReservations.length,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
