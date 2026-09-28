"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Cropper, { Area } from "react-easy-crop";

export default function NewProductPage() {
  const router = useRouter();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Area | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setImageSrc(imageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setShowCropper(true);
    setError("");
  };

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) {
      return null;
    }

    const image = new Image();

    image.src = imageSrc;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Unable to load image."));
    });

    const canvas = document.createElement("canvas");

    const outputSize = 1000;

    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not supported.");
    }

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.9
      );
    });
  };

  const applyCrop = async () => {
    try {
      const blob = await createCroppedImage();

      if (!blob) {
        setError("Unable to crop image.");
        return;
      }

      const previewUrl = URL.createObjectURL(blob);

      setCroppedImage(previewUrl);
      setShowCropper(false);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to crop image.");
    }
  };

  const removeImage = () => {
    setImageSrc(null);
    setCroppedImage(null);
    setShowCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const uploadProductImage = async (
    productId: number,
    token: string
  ) => {
    if (!croppedImage) {
      return;
    }

    setUploadingImage(true);

    try {
      const response = await fetch(croppedImage);

      const blob = await response.blob();

      const file = new File(
        [blob],
        "product-image.jpg",
        {
          type: "image/jpeg",
        }
      );

      const formData = new FormData();

      formData.append("file", file);

      const uploadResponse = await fetch(
        `http://127.0.0.1:8000/product-images/${productId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();

        throw new Error(
          data.detail || "Image upload failed."
        );
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");

    if (!productName.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!stockQuantity || Number(stockQuantity) < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/products/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_name: productName.trim(),
            description: description.trim() || null,
            price: Number(price),
            stock_quantity: Number(stockQuantity),
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create product."
        );
      }

      const productId = data.product.id;

      if (croppedImage) {
        await uploadProductImage(productId, token);
      }

      router.push("/products");
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">

          <div>
            <button
              onClick={() => router.push("/products")}
              className="text-2xl font-bold hover:text-blue-400 transition"
            >
              BizPilot <span className="text-blue-500">AI</span>
            </button>

            <p className="text-sm text-slate-400 mt-1">
              Add New Product
            </p>
          </div>

          <button
            onClick={() => router.push("/products")}
            className="text-sm text-slate-400 hover:text-white transition"
          >
            ← Back to Products
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Add Product
          </h1>

          <p className="text-slate-400 mt-2">
            Add your product information and an optional product image.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >

          {/* Product information */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-6">
              Product Information
            </h2>

            {/* Product name */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Product Name
              </label>

              <input
                type="text"
                value={productName}
                onChange={(e) =>
                  setProductName(e.target.value)
                }
                placeholder="e.g. Premium Cotton T-Shirt"
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
                  setDescription(e.target.value)
                }
                placeholder="Describe your product..."
                rows={5}
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
                    setPrice(e.target.value)
                  }
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-3 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Stock */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stock Quantity
              </label>

              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) =>
                  setStockQuantity(e.target.value)
                }
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition"
              />
            </div>

          </div>

          {/* Product image */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold mb-2">
              Product Image
            </h2>

            <p className="text-sm text-slate-400 mb-6">
              Upload JPG, PNG or WEBP. You can crop, zoom and reposition it.
            </p>

            {/* Image preview */}
            {croppedImage ? (
              <div>

                <div className="aspect-square rounded-xl overflow-hidden bg-slate-800 mb-4">
                  <img
                    src={croppedImage}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex gap-3">

                  <label className="flex-1 cursor-pointer text-center border border-slate-700 hover:bg-slate-800 transition rounded-lg py-3">
                    Change Image

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    Remove
                  </button>

                </div>

              </div>
            ) : (
              <label className="block cursor-pointer">

                <div className="aspect-square border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-800/50 rounded-xl flex flex-col items-center justify-center transition">

                  <div className="text-5xl mb-4">
                    🖼️
                  </div>

                  <p className="font-medium">
                    Click to upload image
                  </p>

                  <p className="text-sm text-slate-500 mt-2">
                    JPG, PNG or WEBP
                  </p>

                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:cursor-not-allowed transition py-3 rounded-lg font-semibold"
            >
              {loading
                ? uploadingImage
                  ? "Uploading image..."
                  : "Creating product..."
                : "Create Product"}
            </button>

          </div>

        </form>

      </main>

      {/* Crop modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">

          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

            {/* Cropper */}
            <div className="relative h-[60vh] bg-black">

              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />

            </div>

            {/* Crop controls */}
            <div className="p-5">

              <div className="mb-5">

                <div className="flex items-center justify-between mb-2">

                  <label className="text-sm text-slate-300">
                    Zoom
                  </label>

                  <span className="text-sm text-slate-500">
                    {zoom.toFixed(1)}x
                  </span>

                </div>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) =>
                    setZoom(Number(e.target.value))
                  }
                  className="w-full"
                />

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setShowCropper(false);
                    setImageSrc(null);
                  }}
                  className="flex-1 border border-slate-700 hover:bg-slate-800 transition py-3 rounded-lg font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={applyCrop}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 transition py-3 rounded-lg font-medium"
                >
                  Apply Crop
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}