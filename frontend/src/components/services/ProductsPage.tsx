import React, { useEffect, useState } from "react";
import { settingsService } from "../../services/settingsService";
import { Card } from "../common/Card";
import { Alert } from "../common/Alert";
import { Button } from "../common/Button";
import { Product } from "../../types";

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    settingsService
      .getProducts()
      .then(setProducts)
      .catch(() => setError("Failed to load products"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSell = async (product: Product) => {
    const quantity = quantities[product.id] ?? 1;
    setSellingId(product.id);
    setError(null);
    try {
      const updated = await settingsService.sellProduct(product.id, {
        quantity,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setSuccessMessage(`Sold ${quantity}x ${product.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError(`Failed to sell ${product.name}`);
    } finally {
      setSellingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Products
      </h1>

      {successMessage && (
        <Alert type="success" title="Sold" message={successMessage} />
      )}
      {error && (
        <Alert
          type="error"
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {isLoading ? (
        <div className="text-gray-500 dark:text-gray-400">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <Card>
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No products available.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products
            .filter((p) => p.isActive)
            .map((product) => {
              const outOfStock = product.stockCount <= 0;
              return (
                <Card key={product.id}>
                  <div className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h2>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ₱{product.price.toFixed(2)}
                    </p>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantity
                      <input
                        type="number"
                        min="1"
                        max={product.stockCount}
                        value={quantities[product.id] ?? 1}
                        onChange={(e) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product.id]: Math.max(
                              1,
                              Math.min(
                                product.stockCount,
                                parseInt(e.target.value, 10) || 1,
                              ),
                            ),
                          }))
                        }
                        disabled={outOfStock || sellingId === product.id}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total: ₱
                      {(product.price * (quantities[product.id] ?? 1)).toFixed(
                        2,
                      )}
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        outOfStock
                          ? "text-red-500 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {outOfStock
                        ? "Out of stock"
                        : `${product.stockCount} in stock`}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={outOfStock || sellingId === product.id}
                      loading={sellingId === product.id}
                      onClick={() => handleSell(product)}
                    >
                      {outOfStock ? "Out of Stock" : "Sell"}
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
};
