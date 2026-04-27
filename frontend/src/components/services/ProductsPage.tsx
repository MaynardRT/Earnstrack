import React, { useEffect, useState } from "react";
import { settingsService } from "../../services/settingsService";
import { Card } from "../common/Card";
import { Alert } from "../common/Alert";
import { Product } from "../../types";

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsService
      .getProducts()
      .then(setProducts)
      .catch(() => setError("Failed to load products"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Products
      </h1>

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
            .map((product) => (
              <Card key={product.id}>
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {product.name}
                  </h2>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₱{product.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {product.stockCount > 0
                      ? `${product.stockCount} in stock`
                      : "Out of stock"}
                  </p>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};
