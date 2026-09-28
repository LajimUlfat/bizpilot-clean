"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Product = {
  id: number;
  product_name: string;
  description?: string | null;
  price: number;
  stock_quantity?: number;
};

type AdDraft = {
  id: number;
  product_id: number;
  platform: string;
  objective: string;
  tone: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
  hashtags: string[];
  audience: string;
  best_time: string;
  strategy: string;
  status: string;
  created_at?: string;
};

type DraftForm = {
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
  hashtags: string;
  audience: string;
  best_time: string;
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

function formatDate(dateString?: string) {
  if (!dateString) {
    return "Unknown date";
  }

  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

export default function AdDraftsPage() {
  const [drafts, setDrafts] = useState<AdDraft[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productImages, setProductImages] = useState<
    Record<number, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDraft, setSelectedDraft] =
    useState<AdDraft | null>(null);

  const [editingDraft, setEditingDraft] =
    useState<AdDraft | null>(null);

  const [editForm, setEditForm] = useState<DraftForm>({
    primary_text: "",
    headline: "",
    description: "",
    cta: "",
    hashtags: "",
    audience: "",
    best_time: "",
    strategy: "",
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [copiedId, setCopiedId] =
    useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const token = getAuthToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const [draftsResponse, productsResponse] =
        await Promise.all([
          fetch(`${API_URL}/ad-drafts/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/products/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      if (
        draftsResponse.status === 401 ||
        productsResponse.status === 401
      ) {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        window.location.href = "/login";
        return;
      }

      if (!draftsResponse.ok) {
        throw new Error(
          "Failed to load saved advertisements."
        );
      }

      if (!productsResponse.ok) {
        throw new Error(
          "Failed to load products."
        );
      }

      const draftsResponseData =
        await draftsResponse.json();

      const productsResponseData =
        await productsResponse.json();

      let draftsData: AdDraft[] = [];
      let productsData: Product[] = [];

      if (Array.isArray(draftsResponseData)) {
        draftsData = draftsResponseData;
      } else if (
        Array.isArray(draftsResponseData.drafts)
      ) {
        draftsData = draftsResponseData.drafts;
      }

      if (Array.isArray(productsResponseData)) {
        productsData = productsResponseData;
      } else if (
        Array.isArray(productsResponseData.products)
      ) {
        productsData = productsResponseData.products;
      }

      setDrafts(draftsData);
      setProducts(productsData);

      await loadProductImages(
        productsData,
        token
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProductImages(
    productsData: Product[],
    token: string
  ) {
    const imageMap: Record<number, string> = {};

    await Promise.all(
      productsData.map(async (product) => {
        try {
          const response = await fetch(
            `${API_URL}/product-images/${product.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            return;
          }

          const data = await response.json();

          const images = Array.isArray(data.images)
            ? data.images
            : [];

          const primaryImage =
            images.find(
              (image: {
                id: number;
                product_id: number;
                image_url: string;
                is_primary: boolean;
              }) => image.is_primary
            ) || images[0];

          if (primaryImage?.image_url) {
            imageMap[product.id] =
              getImageUrl(
                primaryImage.image_url
              );
          }
        } catch (err) {
          console.error(
            `Failed to load image for product ${product.id}:`,
            err
          );
        }
      })
    );

    setProductImages(imageMap);
  }

  const productMap = useMemo(() => {
    const map: Record<number, Product> = {};

    products.forEach((product) => {
      map[product.id] = product;
    });

    return map;
  }, [products]);

  function getProductName(productId: number) {
    return (
      productMap[productId]?.product_name ||
      "Unknown Product"
    );
  }

  function getProductPrice(productId: number) {
    const product = productMap[productId];

    if (!product) {
      return null;
    }

    return product.price;
  }

  async function copyDraft(draft: AdDraft) {
    const text = [
      draft.primary_text,
      "",
      draft.headline,
      draft.description,
      "",
      `CTA: ${draft.cta}`,
      "",
      draft.hashtags?.join(" ") || "",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);

      setCopiedId(draft.id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  function openEditModal(draft: AdDraft) {
    setEditingDraft(draft);

    setEditForm({
      primary_text: draft.primary_text || "",
      headline: draft.headline || "",
      description: draft.description || "",
      cta: draft.cta || "",
      hashtags: Array.isArray(draft.hashtags)
        ? draft.hashtags.join(", ")
        : "",
      audience: draft.audience || "",
      best_time: draft.best_time || "",
      strategy: draft.strategy || "",
    });
  }

  function closeEditModal() {
    if (saving) {
      return;
    }

    setEditingDraft(null);
  }

  async function saveEditedDraft() {
    if (!editingDraft) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);

    try {
      const hashtags = editForm.hashtags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await fetch(
        `${API_URL}/ad-drafts/${editingDraft.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            primary_text: editForm.primary_text,
            headline: editForm.headline,
            description: editForm.description,
            cta: editForm.cta,
            hashtags,
            audience: editForm.audience,
            best_time: editForm.best_time,
            strategy: editForm.strategy,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to update draft."
        );
      }

      const data = await response.json();

      const updatedDraft = data.draft;

      if (updatedDraft) {
        setDrafts((currentDrafts) =>
          currentDrafts.map((draft) =>
            draft.id === updatedDraft.id
              ? updatedDraft
              : draft
          )
        );
      }

      setEditingDraft(null);
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteDraft(draftId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this ad draft?"
    );

    if (!confirmed) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setDeletingId(draftId);

    try {
      const response = await fetch(
        `${API_URL}/ad-drafts/${draftId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");

        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.detail ||
            "Failed to delete draft."
        );
      }

      setDrafts((currentDrafts) =>
        currentDrafts.filter(
          (draft) => draft.id !== draftId
        )
      );

      if (selectedDraft?.id === draftId) {
        setSelectedDraft(null);
      }
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete draft."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function updateEditField(
    field: keyof DraftForm,
    value: string
  ) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-400" />

            <p className="text-sm text-slate-400">
              Loading saved advertisements...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#070b1c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-slate-400 transition hover:text-white"
              >
                ←
              </Link>

              <div>
                <h1 className="text-xl font-bold sm:text-2xl">
                  Ad Drafts
                </h1>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  Manage your saved AI-generated advertisements
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/ai-ad-generation"
            className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
          >
            + Create New Ad
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Drafts
            </p>

            <p className="mt-2 text-3xl font-bold">
              {drafts.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Products
            </p>

            <p className="mt-2 text-3xl font-bold">
              {products.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              AI Ads
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-300">
              {drafts.length}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {drafts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-20 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-purple-500/20 bg-purple-500/10 text-4xl">
              📝
            </div>

            <h2 className="text-2xl font-bold">
              No Ad Drafts Yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
              Generate your first AI advertisement and save
              it here. You can later edit, copy, or manage
              your saved ads.
            </p>

            <Link
              href="/ai-ad-generation"
              className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
            >
              Generate Your First Ad
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {drafts.map((draft) => {
              const productImage =
                productImages[draft.product_id];

              const productPrice =
                getProductPrice(
                  draft.product_id
                );

              return (
                <article
                  key={draft.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-purple-500/30"
                >
                  {/* Product Image */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={getProductName(
                          draft.product_id
                        )}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-950/40 via-slate-950 to-blue-950/40">
                        <div className="text-center">
                          <div className="text-4xl">
                            🛍️
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            Product image unavailable
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Platform */}
                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-medium backdrop-blur-xl">
                      {draft.platform ===
                      "Facebook"
                        ? "🔵 Facebook"
                        : draft.platform ===
                          "Instagram"
                        ? "📸 Instagram"
                        : `📱 ${draft.platform}`}
                    </div>

                    {/* Status */}
                    <div className="absolute right-4 top-4 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-xl">
                      {draft.status || "draft"}
                    </div>

                    {/* Product info */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="truncate text-lg font-bold">
                        {getProductName(
                          draft.product_id
                        )}
                      </h2>

                      {productPrice !== null && (
                        <p className="mt-1 text-sm font-medium text-purple-300">
                          BDT{" "}
                          {Number(
                            productPrice
                          ).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-300">
                        {draft.objective}
                      </span>

                      <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[11px] text-purple-300">
                        {draft.tone}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-lg font-semibold">
                      {draft.headline}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                      {draft.primary_text}
                    </p>

                    <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        CTA
                      </p>

                      <p className="mt-1 text-sm font-medium text-white">
                        {draft.cta}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {formatDate(
                          draft.created_at
                        )}
                      </span>

                      <span>
                        Draft #{draft.id}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setSelectedDraft(
                            draft
                          )
                        }
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-purple-500/30 hover:bg-purple-500/10"
                      >
                        👁 View
                      </button>

                      <button
                        onClick={() =>
                          openEditModal(
                            draft
                          )
                        }
                        className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-sm font-medium text-blue-300 transition hover:bg-blue-500/15"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() =>
                          copyDraft(draft)
                        }
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/15"
                      >
                        {copiedId === draft.id
                          ? "✓ Copied"
                          : "📋 Copy"}
                      </button>

                      <button
                        onClick={() =>
                          deleteDraft(
                            draft.id
                          )
                        }
                        disabled={
                          deletingId ===
                          draft.id
                        }
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId ===
                        draft.id
                          ? "Deleting..."
                          : "🗑 Delete"}
                      </button>

                      {/* NEW: Create Campaign */}
                      <Link
                        href={`/campaigns/new?draft_id=${draft.id}`}
                        className="col-span-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2.5 text-center text-sm font-semibold text-purple-300 transition hover:border-purple-500/40 hover:bg-purple-500/15"
                      >
                        🚀 Create Campaign
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* View Modal */}
      {selectedDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() =>
            setSelectedDraft(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0a1024] shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a1024]/95 px-6 py-5 backdrop-blur-xl">
              <div>
                <p className="text-xs uppercase tracking-wider text-purple-400">
                  Saved Advertisement
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {selectedDraft.headline}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedDraft(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Product */}
              <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                  {productImages[
                    selectedDraft.product_id
                  ] ? (
                    <img
                      src={
                        productImages[
                          selectedDraft.product_id
                        ]
                      }
                      alt={getProductName(
                        selectedDraft.product_id
                      )}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">
                      🛍️
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Product
                  </p>

                  <p className="mt-1 font-semibold">
                    {getProductName(
                      selectedDraft.product_id
                    )}
                  </p>

                  {getProductPrice(
                    selectedDraft.product_id
                  ) !== null && (
                    <p className="mt-1 text-sm text-purple-300">
                      BDT{" "}
                      {Number(
                        getProductPrice(
                          selectedDraft.product_id
                        )
                      ).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300">
                  {selectedDraft.platform}
                </span>

                <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-300">
                  {selectedDraft.objective}
                </span>

                <span className="rounded-lg border border-pink-500/20 bg-pink-500/10 px-3 py-1.5 text-xs text-pink-300">
                  {selectedDraft.tone}
                </span>
              </div>

              {/* Primary Text */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Primary Text
                </p>

                <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-7 text-slate-200">
                  {selectedDraft.primary_text}
                </div>
              </section>

              {/* Headline */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Headline
                </p>

                <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-5 text-lg font-semibold">
                  {selectedDraft.headline}
                </div>
              </section>

              {/* Description */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </p>

                <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-slate-300">
                  {selectedDraft.description}
                </div>
              </section>

              {/* CTA */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Call To Action
                </p>

                <div className="mt-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 font-semibold text-emerald-300">
                  {selectedDraft.cta}
                </div>
              </section>

              {/* Audience + Time */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Target Audience
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {selectedDraft.audience}
                  </p>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Best Time
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {selectedDraft.best_time}
                  </p>
                </section>
              </div>

              {/* Strategy */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  AI Strategy
                </p>

                <div className="mt-2 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 text-sm leading-7 text-slate-300">
                  {selectedDraft.strategy}
                </div>
              </section>

              {/* Hashtags */}
              {selectedDraft.hashtags?.length >
                0 && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Hashtags
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDraft.hashtags.map(
                      (hashtag, index) => (
                        <span
                          key={`${hashtag}-${index}`}
                          className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300"
                        >
                          {hashtag}
                        </span>
                      )
                    )}
                  </div>
                </section>
              )}

              {/* Modal Actions */}
              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
                <button
                  onClick={() =>
                    copyDraft(
                      selectedDraft
                    )
                  }
                  className="flex-1 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/15"
                >
                  {copiedId ===
                  selectedDraft.id
                    ? "✓ Copied"
                    : "📋 Copy Advertisement"}
                </button>

                <button
                  onClick={() => {
                    openEditModal(
                      selectedDraft
                    );
                    setSelectedDraft(null);
                  }}
                  className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/15"
                >
                  ✏️ Edit Advertisement
                </button>

                <Link
                  href={`/campaigns/new?draft_id=${selectedDraft.id}`}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-center text-sm font-semibold shadow-lg shadow-purple-500/20 transition hover:scale-[1.01]"
                >
                  🚀 Create Campaign
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDraft && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={closeEditModal}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0a1024] shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a1024]/95 px-6 py-5 backdrop-blur-xl">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-400">
                  Edit Draft
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Modify Advertisement
                </h2>
              </div>

              <button
                onClick={closeEditModal}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Primary Text */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Primary Text
                </label>

                <textarea
                  value={editForm.primary_text}
                  onChange={(event) =>
                    updateEditField(
                      "primary_text",
                      event.target.value
                    )
                  }
                  rows={7}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50"
                />
              </div>

              {/* Headline */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Headline
                </label>

                <input
                  value={editForm.headline}
                  onChange={(event) =>
                    updateEditField(
                      "headline",
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    updateEditField(
                      "description",
                      event.target.value
                    )
                  }
                  rows={4}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50"
                />
              </div>

              {/* CTA */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  CTA
                </label>

                <input
                  value={editForm.cta}
                  onChange={(event) =>
                    updateEditField(
                      "cta",
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50"
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Hashtags
                </label>

                <input
                  value={editForm.hashtags}
                  onChange={(event) =>
                    updateEditField(
                      "hashtags",
                      event.target.value
                    )
                  }
                  placeholder="#coffee, #dhaka, #coldcoffee"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Separate hashtags using commas.
                </p>
              </div>

              {/* Audience */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Target Audience
                </label>

                <textarea
                  value={editForm.audience}
                  onChange={(event) =>
                    updateEditField(
                      "audience",
                      event.target.value
                    )
                  }
                  rows={3}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50"
                />
              </div>

              {/* Best Time */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Best Time
                </label>

                <input
                  value={editForm.best_time}
                  onChange={(event) =>
                    updateEditField(
                      "best_time",
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50"
                />
              </div>

              {/* Strategy */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  AI Strategy
                </label>

                <textarea
                  value={editForm.strategy}
                  onChange={(event) =>
                    updateEditField(
                      "strategy",
                      event.target.value
                    )
                  }
                  rows={5}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row">
                <button
                  onClick={closeEditModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={saveEditedDraft}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-semibold shadow-lg shadow-purple-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving Changes..."
                    : "💾 Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

