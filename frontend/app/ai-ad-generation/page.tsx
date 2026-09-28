"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type Product = {
  id: number;
  product_name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
};

type ProductImage = {
  id: number;
  image_url: string;
  is_primary: boolean;
};

type GeneratedAd = {
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  hashtags: string[];
  audience: string;
  bestTime: string;
  strategy: string;
};

function getAuthToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    ""
  );
}

function getImageUrl(imageUrl: string) {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `${API_URL}${imageUrl}`;
}

export default function AIAdGenerationPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [productImages, setProductImages] = useState<
    Record<number, ProductImage[]>
  >({});

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [platform, setPlatform] = useState("Facebook");
  const [objective, setObjective] = useState("Sales");
  const [tone, setTone] = useState("Professional");

  const [additionalInstructions, setAdditionalInstructions] =
    useState("");

  const [generatedAd, setGeneratedAd] =
    useState<GeneratedAd | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // LOAD BUSINESS + PRODUCTS
  // ============================================

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    loadData();
  }, [router]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        router.push("/login");
        return;
      }

      // ========================================
      // GET BUSINESS
      // ========================================

      const businessResponse = await fetch(
        `${API_URL}/businesses/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (businessResponse.status === 401) {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        router.push("/login");
        return;
      }

      if (!businessResponse.ok) {
        throw new Error(
          "Failed to load business information."
        );
      }

      const businessData =
        await businessResponse.json();

      setBusinessName(
        businessData.business_name || ""
      );

      // ========================================
      // GET PRODUCTS
      // ========================================

      const productsResponse = await fetch(
        `${API_URL}/products/`,
        {
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

      const productsResponseData =
        await productsResponse.json();

      // ========================================
      // HANDLE BOTH RESPONSE TYPES
      //
      // 1. [...]
      //
      // 2. { products: [...] }
      // ========================================

      let productsData: Product[] = [];

      if (Array.isArray(productsResponseData)) {
        productsData = productsResponseData;
      } else if (
        Array.isArray(
          productsResponseData.products
        )
      ) {
        productsData =
          productsResponseData.products;
      }

      setProducts(productsData);

      // ========================================
      // SELECT FIRST PRODUCT
      // ========================================

      if (productsData.length > 0) {
        setSelectedProductId(
          String(productsData[0].id)
        );
      }

      // ========================================
      // GET PRODUCT IMAGES
      // ========================================

      const imageMap: Record<
        number,
        ProductImage[]
      > = {};

      await Promise.all(
        productsData.map(
          async (product: Product) => {
            try {
              const imageResponse =
                await fetch(
                  `${API_URL}/product-images/${product.id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

              if (
                imageResponse.status === 401
              ) {
                return;
              }

              if (!imageResponse.ok) {
                imageMap[product.id] = [];
                return;
              }

              const imageResponseData =
                await imageResponse.json();

              // Handle both:
              //
              // [...]
              //
              // OR
              //
              // { images: [...] }

              let images: ProductImage[] = [];

              if (
                Array.isArray(
                  imageResponseData
                )
              ) {
                images =
                  imageResponseData;
              } else if (
                Array.isArray(
                  imageResponseData.images
                )
              ) {
                images =
                  imageResponseData.images;
              }

              imageMap[product.id] =
                images;
            } catch (imageError) {
              console.error(
                "Product image error:",
                imageError
              );

              imageMap[product.id] = [];
            }
          }
        )
      );

      setProductImages(imageMap);
    } catch (err) {
      console.error(
        "AI Ad page load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your business and products."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // GENERATE AI AD
  // ============================================

  async function handleGenerate() {
    if (!selectedProductId) {
      setError(
        "Please select a product first."
      );
      return;
    }

    try {
      setGenerating(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/ai/ad-generation`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            product_id:
              Number(selectedProductId),

            platform,

            objective,

            tone,

            additional_instructions:
              additionalInstructions.trim() ||
              null,
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
            "Failed to generate AI advertisement."
        );
      }

      if (!data.ad) {
        throw new Error(
          "AI response did not contain advertisement data."
        );
      }

      const ad = data.ad;

      setGeneratedAd({
        primaryText:
          ad.primary_text || "",

        headline:
          ad.headline || "",

        description:
          ad.description || "",

        cta:
          ad.cta || "",

        hashtags:
          Array.isArray(ad.hashtags)
            ? ad.hashtags
            : [],

        audience:
          ad.audience || "",

        bestTime:
          ad.best_time || "",

        strategy:
          ad.strategy || "",
      });
    } catch (err) {
      console.error(
        "AI generation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the ad."
      );
    } finally {
      setGenerating(false);
    }
  }

  // ============================================
  // REGENERATE
  // ============================================

  async function handleRegenerate() {
    await handleGenerate();
  }

  // ============================================
  // COPY
  // ============================================

  function handleCopy() {
    if (!generatedAd) {
      return;
    }

    const text = `${generatedAd.primaryText}

${generatedAd.headline}

${generatedAd.description}

${generatedAd.cta}

${generatedAd.hashtags.join(" ")}`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert(
          "Advertisement copied! 📋"
        );
      })
      .catch(() => {
        setError(
          "Failed to copy advertisement."
        );
      });
  }

  // ============================================
  // SAVE DRAFT
  // ============================================

  async function handleSaveDraft() {
    if (
      !generatedAd ||
      !selectedProductId
    ) {
      setError(
        "Generate an advertisement first."
      );
      return;
    }

    try {
      setError("");

      const token = getAuthToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/ad-drafts/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            product_id:
              Number(selectedProductId),

            platform,

            objective,

            tone,

            primary_text:
              generatedAd.primaryText,

            headline:
              generatedAd.headline,

            description:
              generatedAd.description,

            cta:
              generatedAd.cta,

            hashtags:
              generatedAd.hashtags,

            audience:
              generatedAd.audience,

            best_time:
              generatedAd.bestTime,

            strategy:
              generatedAd.strategy,
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
            "Failed to save ad draft."
        );
      }

      alert(
        "Ad draft saved successfully! 🎉"
      );
    } catch (err) {
      console.error(
        "Save draft error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save ad draft."
      );
    }
  }

  // ============================================
  // SELECTED PRODUCT
  // ============================================

  const selectedProduct =
    products.find(
      (product) =>
        product.id ===
        Number(selectedProductId)
    );

  const selectedImages =
    selectedProductId
      ? productImages[
          Number(selectedProductId)
        ] || []
      : [];

  const primaryImage =
    selectedImages.find(
      (image) => image.is_primary
    ) || selectedImages[0];

  // ============================================
  // LOADING SCREEN
  // ============================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white flex items-center justify-center">

        <div className="text-center">

          <div className="text-2xl font-semibold">
            Loading BizPilot AI...
          </div>

          <p className="text-gray-400 mt-2">
            Preparing your AI Ad Generator
          </p>

        </div>

      </main>
    );
  }

  // ============================================
  // MAIN PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-[#050816] text-white">

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ======================================
            HEADER
        ======================================= */}

        <div className="mb-10">

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="text-gray-400 hover:text-white transition mb-6"
          >
            ← Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-3">

            <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xl">
              ✨
            </div>

            <div>

              <p className="text-purple-400 text-sm font-medium">
                AI MARKETING STUDIO
              </p>

              <h1 className="text-4xl font-bold">
                AI Ad Generation
              </h1>

            </div>

          </div>

          <p className="text-gray-400 max-w-2xl">
            Create platform-ready advertisements
            using your real business and product
            information.
          </p>

        </div>

        {/* ======================================
            ERROR
        ======================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        {/* ======================================
            MAIN GRID
        ======================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ====================================
              LEFT SIDE
          ===================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            {/* Business */}

            <div className="mb-8">

              <p className="text-gray-500 text-sm">
                BUSINESS
              </p>

              <h2 className="text-xl font-semibold mt-1">
                {businessName ||
                  "Your Business"}
              </h2>

            </div>

            {/* Product */}

            <div className="mb-6">

              <label className="block text-sm text-gray-300 mb-2">
                Select Product
              </label>

              <select
                value={selectedProductId}
                onChange={(e) => {

                  setSelectedProductId(
                    e.target.value
                  );

                  setGeneratedAd(null);
                  setError("");

                }}
                className="w-full rounded-xl bg-[#0b1020] border border-white/10 px-4 py-3 outline-none focus:border-purple-500"
              >

                <option value="">
                  Select a product
                </option>

                {products.map(
                  (product) => (

                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.product_name} — ৳
                      {product.price}
                    </option>

                  )
                )}

              </select>

              {products.length === 0 && (
                <p className="text-sm text-yellow-400 mt-2">
                  No products found. Please
                  add a product first.
                </p>
              )}

            </div>

            {/* Product Preview */}

            {selectedProduct && (

              <div className="mb-6 rounded-xl border border-white/10 bg-black/20 overflow-hidden">

                <div className="h-52 bg-black/30 flex items-center justify-center">

                  {primaryImage ? (

                    <img
                      src={getImageUrl(
                        primaryImage.image_url
                      )}
                      alt={
                        selectedProduct.product_name
                      }
                      className="w-full h-full object-cover"
                    />

                  ) : (

                    <div className="text-gray-500">
                      No product image
                    </div>

                  )}

                </div>

                <div className="p-4">

                  <h3 className="font-semibold text-lg">
                    {
                      selectedProduct.product_name
                    }
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {selectedProduct.description ||
                      "No product description available."}
                  </p>

                  <div className="mt-3 text-purple-400 font-semibold">
                    ৳
                    {
                      selectedProduct.price
                    }
                  </div>

                </div>

              </div>

            )}

            {/* Platform */}

            <div className="mb-6">

              <label className="block text-sm text-gray-300 mb-2">
                Platform
              </label>

              <div className="grid grid-cols-2 gap-3">

                {[
                  "Facebook",
                  "Instagram",
                ].map((item) => (

                  <button
                    key={item}
                    onClick={() => {

                      setPlatform(item);
                      setGeneratedAd(null);

                    }}
                    className={`rounded-xl border px-4 py-3 transition ${
                      platform === item
                        ? "border-purple-500 bg-purple-500/10 text-purple-300"
                        : "border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>

            {/* Objective */}

            <div className="mb-6">

              <label className="block text-sm text-gray-300 mb-2">
                Campaign Objective
              </label>

              <select
                value={objective}
                onChange={(e) => {

                  setObjective(
                    e.target.value
                  );

                  setGeneratedAd(null);

                }}
                className="w-full rounded-xl bg-[#0b1020] border border-white/10 px-4 py-3 outline-none focus:border-purple-500"
              >

                <option>
                  Sales
                </option>

                <option>
                  Traffic
                </option>

                <option>
                  Engagement
                </option>

                <option>
                  Brand Awareness
                </option>

              </select>

            </div>

            {/* Tone */}

            <div className="mb-6">

              <label className="block text-sm text-gray-300 mb-2">
                Content Tone
              </label>

              <select
                value={tone}
                onChange={(e) => {

                  setTone(
                    e.target.value
                  );

                  setGeneratedAd(null);

                }}
                className="w-full rounded-xl bg-[#0b1020] border border-white/10 px-4 py-3 outline-none focus:border-purple-500"
              >

                <option>
                  Professional
                </option>

                <option>
                  Friendly
                </option>

                <option>
                  Funny
                </option>

                <option>
                  Luxury
                </option>

                <option>
                  Gen-Z
                </option>

                <option>
                  Promotional
                </option>

              </select>

            </div>

            {/* Additional Instructions */}

            <div className="mb-7">

              <label className="block text-sm text-gray-300 mb-2">
                Additional Instructions
              </label>

              <textarea
                value={
                  additionalInstructions
                }
                onChange={(e) =>
                  setAdditionalInstructions(
                    e.target.value
                  )
                }
                placeholder="Example: Target university students and make the ad feel energetic."
                rows={5}
                maxLength={1000}
                className="w-full rounded-xl bg-[#0b1020] border border-white/10 px-4 py-3 outline-none focus:border-purple-500 resize-none"
              />

              <p className="text-xs text-gray-600 mt-2">
                {
                  additionalInstructions.length
                }
                /1000
              </p>

            </div>

            {/* Generate */}

            <button
              onClick={handleGenerate}
              disabled={
                generating ||
                !selectedProductId ||
                products.length === 0
              }
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed py-4 font-semibold transition shadow-lg shadow-purple-900/20"
            >

              {generating
                ? "✨ AI is generating..."
                : "✨ Generate AI Advertisement"}

            </button>

          </section>

          {/* ====================================
              RIGHT SIDE
          ===================================== */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            {/* Output Header */}

            <div className="flex items-center justify-between mb-6">

              <div>

                <p className="text-gray-500 text-sm">
                  AI OUTPUT
                </p>

                <h2 className="text-2xl font-semibold">
                  Advertisement Preview
                </h2>

              </div>

              {generatedAd && (

                <div className="px-3 py-1 rounded-full text-xs bg-green-500/10 border border-green-500/20 text-green-400">
                  AI Generated
                </div>

              )}

            </div>

            {/* Empty State */}

            {!generatedAd ? (

              <div className="min-h-[650px] rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-center px-8">

                <div>

                  <div className="text-5xl mb-5">
                    ✨
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    Your AI advertisement will
                    appear here
                  </h3>

                  <p className="text-gray-500 max-w-md">
                    Select a product, choose
                    your platform and campaign
                    objective, then let BizPilot
                    AI create the advertisement.
                  </p>

                </div>

              </div>

            ) : (

              <div className="space-y-5">

                {/* =================================
                    AD PREVIEW
                ================================== */}

                <div className="rounded-2xl border border-white/10 bg-[#090d1a] overflow-hidden">

                  {primaryImage && (

                    <div className="h-64">

                      <img
                        src={getImageUrl(
                          primaryImage.image_url
                        )}
                        alt={
                          selectedProduct?.product_name ||
                          "Product"
                        }
                        className="w-full h-full object-cover"
                      />

                    </div>

                  )}

                  <div className="p-6">

                    <div className="text-xs text-gray-500 mb-3">
                      {platform.toUpperCase()} •{" "}
                      {objective.toUpperCase()}
                    </div>

                    {/* Primary Text */}

                    <p className="text-gray-200 leading-7 whitespace-pre-line">
                      {
                        generatedAd.primaryText
                      }
                    </p>

                    {/* Headline */}

                    <div className="mt-5">

                      <h3 className="text-xl font-bold">
                        {
                          generatedAd.headline
                        }
                      </h3>

                      <p className="text-gray-400 mt-2">
                        {
                          generatedAd.description
                        }
                      </p>

                    </div>

                    {/* CTA */}

                    <button className="mt-6 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium">
                      {generatedAd.cta}
                    </button>

                    {/* Hashtags */}

                    <div className="mt-5 flex flex-wrap gap-2">

                      {generatedAd.hashtags.map(
                        (
                          hashtag,
                          index
                        ) => (

                          <span
                            key={index}
                            className="text-sm text-purple-400"
                          >
                            {hashtag}
                          </span>

                        )
                      )}

                    </div>

                  </div>

                </div>

                {/* =================================
                    AI INSIGHTS
                ================================== */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  {/* Audience */}

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">

                    <p className="text-xs text-gray-500">
                      TARGET AUDIENCE
                    </p>

                    <p className="text-sm text-gray-200 mt-2">
                      {
                        generatedAd.audience
                      }
                    </p>

                  </div>

                  {/* Best Time */}

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">

                    <p className="text-xs text-gray-500">
                      BEST TIME
                    </p>

                    <p className="text-sm text-gray-200 mt-2">
                      {
                        generatedAd.bestTime
                      }
                    </p>

                  </div>

                  {/* Strategy */}

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">

                    <p className="text-xs text-gray-500">
                      AI STRATEGY
                    </p>

                    <p className="text-sm text-gray-200 mt-2">
                      {
                        generatedAd.strategy
                      }
                    </p>

                  </div>

                </div>

                {/* =================================
                    ACTION BUTTONS
                ================================== */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                  {/* Copy */}

                  <button
                    onClick={
                      handleCopy
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] py-3 font-medium transition"
                  >
                    📋 Copy
                  </button>

                  {/* Regenerate */}

                  <button
                    onClick={
                      handleRegenerate
                    }
                    disabled={generating}
                    className="rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 py-3 font-medium transition disabled:opacity-50"
                  >

                    {generating
                      ? "Generating..."
                      : "🔄 Regenerate"}

                  </button>

                  {/* Save Draft */}

                  <button
                    onClick={
                      handleSaveDraft
                    }
                    className="rounded-xl bg-white text-black hover:bg-gray-200 py-3 font-semibold transition"
                  >
                    💾 Save Draft
                  </button>

                </div>

              </div>

            )}

          </section>

        </div>

      </div>

    </main>
  );
}

