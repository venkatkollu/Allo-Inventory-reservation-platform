import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch reservation before transaction
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.status === "RELEASED") {
      return NextResponse.json(
        { error: "Reservation already released" },
        { status: 400 }
      );
    }

    if (reservation.status === "CONFIRMED") {
      return NextResponse.json(
        { error: "Cannot release confirmed reservations" },
        { status: 400 }
      );
    }

    // Perform transactional release
    const result = await prisma.$transaction(async (tx) => {
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

      if (inventory.reservedQuantity < reservation.quantity) {
        throw new Error("Invalid reserved quantity for release");
      }

      await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          reservedQuantity: {
            decrement: reservation.quantity,
          },
        },
      });

      // Update reservation status
      const updatedReservation = await tx.reservation.update({
        where: {
          id,
        },
        data: {
          status: "RELEASED",
        },
      });

      return updatedReservation;
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
