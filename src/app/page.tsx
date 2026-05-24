"use client";

import { useEffect, useState } from "react";

interface Inventory {
  warehouseId: string;
  warehouseName: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

interface Product {
  id: string;
  name: string;
  inventories: Inventory[];
}

interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserveData, setReserveData] = useState<{
    productId: string;
    warehouseId: string;
    quantity: number;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const fetchProducts = async () => {
    try {
      const productsRes = await fetch("/api/products");
      const productsData = await productsRes.json();
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setMessage("Failed to load products");
      setMessageType("error");
    }
  };

  const fetchReservations = async () => {
    try {
      const reservationsRes = await fetch("/api/reservations");
      const reservationsData = await reservationsRes.json();
      setReservations(reservationsData);
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
      setMessage("Failed to load reservations");
      setMessageType("error");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProducts(), fetchReservations()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const createReservation = async (
    productId: string,
    warehouseId: string,
    quantity: number
  ) => {
    try {
      setMessage("");
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, warehouseId, quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to create reservation");
        setMessageType("error");
        return;
      }

      setMessage(
        `✅ Reservation created! ID: ${data.id.substring(0, 8)}...`
      );
      setMessageType("success");
      setReserveData(null);
      await Promise.all([fetchProducts(), fetchReservations()]);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error creating reservation");
      setMessageType("error");
    }
  };

  const confirmReservation = async (reservationId: string) => {
    try {
      setMessage("");
      const res = await fetch(`/api/reservations/${reservationId}/confirm`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to confirm reservation");
        setMessageType("error");
        return;
      }

      setMessage(`✅ Reservation confirmed!`);
      setMessageType("success");
      await Promise.all([fetchProducts(), fetchReservations()]);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error confirming reservation");
      setMessageType("error");
    }
  };

  const releaseReservation = async (reservationId: string) => {
    try {
      setMessage("");
      const res = await fetch(`/api/reservations/${reservationId}/release`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to release reservation");
        setMessageType("error");
        return;
      }

      setMessage(`✅ Reservation released!`);
      setMessageType("success");
      await Promise.all([fetchProducts(), fetchReservations()]);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error releasing reservation");
      setMessageType("error");
    }
  };

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>;
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Inventory Reservation Platform</h1>
        <p className="text-gray-600 mb-8">
          Manage temporary stock reservations with real-time inventory tracking
        </p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-8">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">📦 Inventory Status</h2>

            <div className="space-y-6">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-5">
                  <h3 className="text-lg font-semibold mb-4">{product.name}</h3>

                  <div className="space-y-3 mb-4">
                    {product.inventories.map((inventory) => (
                      <div
                        key={inventory.warehouseId}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded"
                      >
                        <div>
                          <p className="font-medium">{inventory.warehouseName}</p>
                          <p className="text-sm text-gray-600">
                            {inventory.availableQuantity} available /
                            {inventory.totalQuantity} total
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {inventory.availableQuantity}
                          </p>
                          {inventory.reservedQuantity > 0 && (
                            <p className="text-sm text-orange-600">
                              {inventory.reservedQuantity} reserved
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    {product.inventories.map((inventory) => (
                      <div key={inventory.warehouseId} className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max={inventory.availableQuantity}
                          placeholder="Qty"
                          className="flex-1 px-3 py-2 border rounded text-sm"
                          onChange={(e) =>
                            setReserveData({
                              productId: product.id,
                              warehouseId: inventory.warehouseId,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                        <button
                          onClick={() =>
                            createReservation(
                              product.id,
                              inventory.warehouseId,
                              reserveData?.quantity || 1
                            )
                          }
                          disabled={inventory.availableQuantity <= 0}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Reserve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {reservations.length > 0 && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">🎟️ My Reservations</h2>

              <div className="space-y-3">
                {reservations.map((reservation) => {
                  const product = products.find(
                    (p) => p.id === reservation.productId
                  );
                  const inventory = product?.inventories.find(
                    (i) => i.warehouseId === reservation.warehouseId
                  );

                  return (
                    <div
                      key={reservation.id}
                      className="border rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">
                          {product?.name} - {inventory?.warehouseName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Qty: {reservation.quantity} | Status:{" "}
                          <span
                            className={`font-medium ${
                              reservation.status === "PENDING"
                                ? "text-orange-600"
                                : reservation.status === "CONFIRMED"
                                  ? "text-green-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {reservation.status}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(reservation.expiresAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {reservation.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => confirmReservation(reservation.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => releaseReservation(reservation.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}