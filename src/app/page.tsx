"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Warehouse, Clock, CheckCircle, XCircle } from "lucide-react";

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

  const clearDatabase = async () => {
    const confirmed = window.confirm(
      "This will cancel all pending reservations and restore inventory availability. Continue?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      const res = await fetch("/api/clear", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to clear database");
        setMessageType("error");
        return;
      }

      setMessage("✅ Database cleared successfully");
      setMessageType("success");
      await Promise.all([fetchProducts(), fetchReservations()]);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error clearing database");
      setMessageType("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-64">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading inventory...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-slate-900 dark:text-slate-50" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                Inventory Manager
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Real-time stock tracking and temporary reservations
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
            <Button variant="outline" onClick={clearDatabase} className="whitespace-nowrap">
              Cancel All Reservations
            </Button>
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className={`mb-6 rounded-lg border p-4 animate-in fade-in ${
            messageType === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-50 dark:border-emerald-800"
              : "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-50 dark:border-red-800"
          }`}>
            <div className="flex items-center gap-3">
              {messageType === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5" />
                  <div>
                    <CardTitle>Available Products</CardTitle>
                    <CardDescription>Create reservations for inventory items</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.length === 0 ? (
                    <p className="text-center py-8 text-slate-500">No products available</p>
                  ) : (
                    products.map((product) => (
                      <Card key={product.id} className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl">{product.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {product.inventories.map((inventory) => (
                              <div
                                key={inventory.warehouseId}
                                className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4"
                              >
                                {/* Warehouse Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Warehouse className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    <span className="font-semibold">{inventory.warehouseName}</span>
                                  </div>
                                  {inventory.availableQuantity > 0 ? (
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-50">
                                      {inventory.availableQuantity} Available
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">Out of Stock</Badge>
                                  )}
                                </div>

                                {/* Stock Info */}
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                                    <p className="text-slate-600 dark:text-slate-400 text-xs">Available</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{inventory.availableQuantity}</p>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                                    <p className="text-slate-600 dark:text-slate-400 text-xs">Reserved</p>
                                    <p className="text-xl font-bold text-orange-600">{inventory.reservedQuantity}</p>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                                    <p className="text-slate-600 dark:text-slate-400 text-xs">Total</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{inventory.totalQuantity}</p>
                                  </div>
                                </div>

                                {/* Reserve Action */}
                                {inventory.availableQuantity > 0 && (
                                  <div className="flex gap-2 pt-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      max={inventory.availableQuantity}
                                      placeholder="Quantity"
                                      defaultValue="1"
                                      className="flex-1"
                                      onChange={(e) =>
                                        setReserveData({
                                          productId: product.id,
                                          warehouseId: inventory.warehouseId,
                                          quantity: parseInt(e.target.value) || 1,
                                        })
                                      }
                                    />
                                    <Button
                                      onClick={() =>
                                        createReservation(
                                          product.id,
                                          inventory.warehouseId,
                                          reserveData?.quantity || 1
                                        )
                                      }
                                      className="px-6"
                                    >
                                      Reserve
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <div>
                    <CardTitle>Active Reservations</CardTitle>
                    <CardDescription>{reservations.length} total</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reservations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      No active reservations yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {reservations.map((reservation) => {
                      const product = products.find((p) => p.id === reservation.productId);
                      const inventory = product?.inventories.find(
                        (i) => i.warehouseId === reservation.warehouseId
                      );

                      const statusColors: Record<string, string> = {
                        PENDING: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-50",
                        CONFIRMED: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-50",
                        RELEASED: "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-50",
                        EXPIRED: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-50",
                      };

                      return (
                        <Card key={reservation.id} className="border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                          <CardContent className="pt-4">
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-50">
                                  {product?.name}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {inventory?.warehouseName}
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-400">Qty:</span>
                                <span className="font-bold text-slate-900 dark:text-slate-50">
                                  {reservation.quantity}
                                </span>
                              </div>

                              <div>
                                <Badge
                                  variant="outline"
                                  className={statusColors[reservation.status] || statusColors.PENDING}
                                >
                                  {reservation.status}
                                </Badge>
                              </div>

                              {reservation.status === "PENDING" && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Expires: {new Date(reservation.expiresAt).toLocaleTimeString()}
                                </p>
                              )}

                              {reservation.status === "PENDING" && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => confirmReservation(reservation.id)}
                                    className="flex-1"
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => releaseReservation(reservation.id)}
                                    className="flex-1"
                                  >
                                    Release
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}