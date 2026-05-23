async function getProducts() {
  const res = await fetch("http://localhost:3000/api/products", {
    cache: "no-store",
  });

  return res.json();
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">
        Inventory Reservation Platform
      </h1>

      <div className="space-y-6">
        {products.map((product: any) => (
          <div
            key={product.id}
            className="border rounded-lg p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-4">
              {product.name}
            </h2>

            <div className="space-y-2">
              {product.inventories.map((inventory: any) => (
                <div
                  key={inventory.warehouseId}
                  className="flex justify-between"
                >
                  <span>{inventory.warehouseName}</span>

                  <span>
                    Available: {inventory.availableQuantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}