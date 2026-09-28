"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
};

function getAuthToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    ""
  );
}

function getImageUrl(imageUrl: string) {
  // Supabase/cloud URL
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  // Old local backend image URL
  return `${API_URL}${imageUrl}`;
}

export default function ManageProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = String(params.id);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [images, setImages] =
    useState<ProductImage[]>([]);

  const [productName, setProductName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [stockQuantity, setStockQuantity] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      const token = getAuthToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
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
            "Failed to load products."
          );
        }

        const productsData =
          await productsResponse.json();

        const foundProduct =
          productsData.products.find(
            (item: Product) =>
              String(item.id) === productId
          );

        if (!foundProduct) {
          setError("Product not found.");
          setLoading(false);
          return;
        }

        setProduct(foundProduct);

        setProductName(
          foundProduct.product_name
        );

        setDescription(
          foundProduct.description || ""
        );

        setPrice(
          String(foundProduct.price)
        );

        setStockQuantity(
          String(foundProduct.stock_quantity)
        );

        const imagesResponse =
          await fetch(
            `${API_URL}/product-images/${productId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        if (imagesResponse.status === 401) {
          localStorage.removeItem("access_token");
          sessionStorage.removeItem("access_token");

          router.push("/login");
          return;
        }

        if (imagesResponse.ok) {
          const imagesData =
            await imagesResponse.json();

          setImages(
            imagesData.images || []
          );
        }
      } catch (err) {
        console.error(
          "Product loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleSave = async () => {
    setError("");
    setMessage("");

    if (!productName.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (
      price === "" ||
      Number(price) < 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    if (
      stockQuantity === "" ||
      Number(stockQuantity) < 0
    ) {
      setError(
        "Please enter a valid stock quantity."
      );
      return;
    }

    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_name:
              productName.trim(),

            description:
              description.trim() || null,

            price: Number(price),

            stock_quantity:
              Number(stockQuantity),
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        sessionStorage.removeItem(
          "access_token"
        );

        router.push("/login");
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to update product."
        );
      }

      setProduct(data.product);

      setMessage(
        "Product updated successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Product update error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmed) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Delete response status:",
        response.status
      );

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        sessionStorage.removeItem(
          "access_token"
        );

        router.push("/login");
        return;
      }

      let data: any = {};

      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        contentType &&
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            `Failed to delete product. Status: ${response.status}`
        );
      }

      router.push("/products");
    } catch (err) {
      console.error(
        "Product delete error:",
        err
      );

      if (err instanceof TypeError) {
        setError(
          "Unable to connect to the backend server. Make sure FastAPI is running."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to delete product."
        );
      }

      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>

          <p className="text-slate-400">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl mb-5">
            📦
          </div>

          <h1 className="text-2xl font-bold mb-3">
            Product not found
          </h1>

          <p className="text-slate-400 mb-6">
            {error ||
              "This product does not exist."}
          </p>

          <button
            onClick={() =>
              router.push("/products")
            }
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <div>
            <button
              onClick={() =>
                router.push("/products")
              }
              className="text-2xl font-bold hover:text-blue-400 transition"
            >
              BizPilot{" "}
              <span className="text-blue-500">
                AI
              </span>
            </button>

            <p className="text-sm text-slate-400 mt-1">
              Manage Product
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/products")
            }
            className="text-sm text-slate-400 hover:text-white transition"
          >
            ← Back to Products
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Page title */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold">
            {product.product_name}
          </h1>

          <p className="text-slate-400 mt-2">
            Manage product information and images.
          </p>

        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-4 rounded-xl">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Product information */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-6">
              Product Information
            </h2>

            {/* Name */}
            <div className="mb-5">

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Product Name
              </label>

              <input
                type="text"
                value={productName}
                onChange={(e) =>
                  setProductName(
                    e.target.value
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition"
              />

            </div>

            {/* Description */}
            <div className="mb-5">

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                rows={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition resize-none"
              />

            </div>

            {/* Price */}
            <div className="mb-5">

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price
              </label>

              <div className="relative">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  ৳
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) =>
                    setPrice(
                      e.target.value
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-3 outline-none focus:border-blue-500 transition"
                />

              </div>

            </div>

            {/* Stock */}
            <div className="mb-7">

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stock Quantity
              </label>

              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) =>
                  setStockQuantity(
                    e.target.value
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition"
              />

            </div>

            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed transition py-3 rounded-lg font-semibold"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full mt-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition py-3 rounded-lg font-medium"
            >
              {deleting
                ? "Deleting..."
                : "Delete Product"}
            </button>

          </div>

          {/* Images */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-xl font-semibold">
                  Product Images
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  {images.length}{" "}
                  {images.length === 1
                    ? "image"
                    : "images"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMessage(
                    "Image management will be added next."
                  );
                }}
                className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-sm font-medium"
              >
                + Add Image
              </button>

            </div>

            {images.length === 0 ? (
              <div className="aspect-square border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center">

                <div className="text-6xl mb-4">
                  🖼️
                </div>

                <p className="font-medium">
                  No product images
                </p>

                <p className="text-sm text-slate-500 mt-2">
                  Add an image to showcase your product.
                </p>

              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">

                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square bg-slate-800 rounded-xl overflow-hidden border border-slate-700"
                  >

                    <img
                      src={getImageUrl(
                        image.image_url
                      )}
                      alt={
                        product.product_name
                      }
                      className="w-full h-full object-cover"
                    />

                    {image.is_primary && (
                      <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-md">
                        Primary
                      </div>
                    )}

                  </div>
                ))}

              </div>
            )}

            <div className="mt-6 bg-slate-800/50 border border-slate-800 rounded-xl p-4">

              <p className="text-sm text-slate-400">
                💡 You will be able to add, delete,
                replace and choose primary images
                from this section.
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}