import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Initial validation before transaction
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Reservation already processed" },
        { status: 400 }
      );
    }

    if (new Date() > reservation.expiresAt) {
      return NextResponse.json(
        { error: "Reservation expired" },
        { status: 410 }
      );
    }

    // Perform transactional update
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      if (
        inventory.totalQuantity < reservation.quantity ||
        inventory.reservedQuantity < reservation.quantity
      ) {
        throw new Error("Invalid inventory state for confirmation");
      }

      await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          totalQuantity: {
            decrement: reservation.quantity,
          },
          reservedQuantity: {
            decrement: reservation.quantity,
          },
        },
      });

      const updatedReservation = await tx.reservation.update({
        where: {
          id,
        },
        data: {
          status: "CONFIRMED",
        },
      });

      return updatedReservation;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Internal server error";

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