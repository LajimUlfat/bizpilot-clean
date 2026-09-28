
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type ProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
};

type Product = {
  id: number;
  business_id: number;
  product_name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  created_at: string;
  images: ProductImage[];
};

function getAuthToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    ""
  );
}

function getImageUrl(imageUrl: string) {
  // New Supabase / cloud image URL
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  // Old local backend image URL
  return `${API_URL}${imageUrl}`;
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const token = getAuthToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Fetch products
        const productsResponse = await fetch(
          `${API_URL}/products/`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (productsResponse.status === 401) {
          localStorage.removeItem("access_token");
          sessionStorage.removeItem("access_token");

          router.push("/login");
          return;
        }

        if (!productsResponse.ok) {
          throw new Error(
            "Failed to fetch products."
          );
        }

        const productsData =
          await productsResponse.json();

        // Fetch images for every product
        const productsWithImages =
          await Promise.all(
            productsData.products.map(
              async (product: Product) => {
                try {
                  const imageResponse =
                    await fetch(
                      `${API_URL}/product-images/${product.id}`,
                      {
                        method: "GET",
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );

                  if (
                    imageResponse.status === 401
                  ) {
                    localStorage.removeItem(
                      "access_token"
                    );

                    sessionStorage.removeItem(
                      "access_token"
                    );

                    router.push("/login");

                    return {
                      ...product,
                      images: [],
                    };
                  }

                  if (!imageResponse.ok) {
                    return {
                      ...product,
                      images: [],
                    };
                  }

                  const imageData =
                    await imageResponse.json();

                  return {
                    ...product,
                    images:
                      imageData.images || [],
                  };
                } catch (err) {
                  console.error(
                    `Failed to load images for product ${product.id}:`,
                    err
                  );

                  return {
                    ...product,
                    images: [],
                  };
                }
              }
            )
          );

        setProducts(productsWithImages);
      } catch (err) {
        console.error(
          "Product loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [router]);

  const getProductImage = (
    product: Product
  ) => {
    if (
      !product.images ||
      product.images.length === 0
    ) {
      return null;
    }

    const primaryImage =
      product.images.find(
        (image) => image.is_primary
      );

    return primaryImage || product.images[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-slate-400">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <div>
            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="text-2xl font-bold tracking-tight hover:text-blue-400 transition"
            >
              BizPilot{" "}
              <span className="text-blue-500">
                AI
              </span>
            </button>

            <p className="text-sm text-slate-400 mt-1">
              Product Management
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/products/new")
            }
            className="bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-lg font-medium"
          >
            + Add Product
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Page title */}
        <div className="flex items-center justify-between mb-8">

          <div>
            <h1 className="text-3xl font-bold">
              Products
            </h1>

            <p className="text-slate-400 mt-2">
              Manage your products, prices, stock
              and images.
            </p>
          </div>

          <div className="text-sm text-slate-400">
            {products.length}{" "}
            {products.length === 1
              ? "product"
              : "products"}
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Empty state */}
        {products.length === 0 &&
          !error && (
            <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-12 text-center">

              <div className="text-6xl mb-5">
                📦
              </div>

              <h2 className="text-2xl font-semibold mb-2">
                No products yet
              </h2>

              <p className="text-slate-400 mb-7">
                Add your first product to start
                managing your inventory.
              </p>

              <button
                onClick={() =>
                  router.push("/products/new")
                }
                className="bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-lg font-medium"
              >
                + Add Your First Product
              </button>

            </div>
          )}

        {/* Product grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {products.map((product) => {
              const productImage =
                getProductImage(product);

              return (
                <div
                  key={product.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition"
                >

                  {/* Product Image */}
                  <div className="aspect-square bg-slate-800 overflow-hidden">

                    {productImage ? (
                      <img
                        src={getImageUrl(
                          productImage.image_url
                        )}
                        alt={
                          product.product_name
                        }
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(
                            "Product image failed to load:",
                            productImage.image_url
                          );

                          e.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">
                          📦
                        </span>
                      </div>
                    )}

                  </div>

                  {/* Product information */}
                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <h2 className="text-lg font-semibold truncate">
                        {product.product_name}
                      </h2>

                      {productImage && (
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md whitespace-nowrap">
                          Image
                        </span>
                      )}

                    </div>

                    {/* Description */}
                    {product.description ? (
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-600 mt-2">
                        No description
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-5 flex items-center justify-between">

                      <div>
                        <p className="text-xs text-slate-500">
                          Price
                        </p>

                        <p className="text-xl font-bold text-white">
                          ৳
                          {Number(
                            product.price
                          ).toFixed(2)}
                        </p>
                      </div>

                      {/* Stock */}
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Stock
                        </p>

                        <p
                          className={`font-semibold ${
                            product.stock_quantity ===
                            0
                              ? "text-red-400"
                              : product.stock_quantity <=
                                5
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {
                            product.stock_quantity
                          }
                        </p>
                      </div>

                    </div>

                    {/* Manage button */}
                    <button
                      onClick={() =>
                        router.push(
                          `/products/${product.id}`
                        )
                      }
                      className="w-full mt-5 border border-slate-700 hover:bg-slate-800 transition py-2.5 rounded-lg text-sm font-medium"
                    >
                      Manage Product
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </main>

    </div>
  );
}
