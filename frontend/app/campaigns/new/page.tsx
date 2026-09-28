"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
};

type Product = {
  id: number;
  product_name: string;
  description?: string | null;
  price: number;
  stock_quantity?: number;
};

function getAuthToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    ""
  );
}

function formatDateForAPI(date: string, endOfDay = false) {
  if (!date) {
    return null;
  }

  return endOfDay
    ? `${date}T23:59:59`
    : `${date}T00:00:00`;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const draftId = searchParams.get("draft_id");

  const [draft, setDraft] =
    useState<AdDraft | null>(null);

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [campaignName, setCampaignName] =
    useState("");

  const [budget, setBudget] =
    useState("");

  const [durationDays, setDurationDays] =
    useState("7");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  useEffect(() => {
    if (!draftId) {
      setError("No ad draft selected.");
      setLoading(false);
      return;
    }

    loadCampaignData();
  }, [draftId]);

  async function loadCampaignData() {
    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      /*
       * Load the selected AI advertisement draft.
       */
      const draftResponse = await fetch(
        `${API_URL}/ad-drafts/${draftId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (draftResponse.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        sessionStorage.removeItem(
          "access_token"
        );

        router.push("/login");
        return;
      }

      const draftData =
        await draftResponse.json();

      if (!draftResponse.ok) {
        throw new Error(
          typeof draftData?.detail ===
            "string"
            ? draftData.detail
            : "Failed to load advertisement draft."
        );
      }

      /*
       * Support both possible backend response formats:
       *
       * { draft: {...} }
       *
       * OR
       *
       * {...}
       */
      const loadedDraft =
        draftData?.draft ||
        draftData;

      if (
        !loadedDraft ||
        !loadedDraft.id ||
        !loadedDraft.product_id
      ) {
        console.error(
          "Unexpected draft response:",
          draftData
        );

        throw new Error(
          "Advertisement draft was not found."
        );
      }

      setDraft(loadedDraft);

      /*
       * Load all products.
       *
       * We do NOT call /products/{id}
       * because the current backend does not
       * provide GET /products/{id}.
       */
      const productsResponse =
        await fetch(
          `${API_URL}/products/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      if (productsResponse.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        sessionStorage.removeItem(
          "access_token"
        );

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

      let products: Product[] = [];

      if (Array.isArray(productsData)) {
        products = productsData;
      } else if (
        Array.isArray(
          productsData?.products
        )
      ) {
        products =
          productsData.products;
      }

      const matchedProduct =
        products.find(
          (item) =>
            Number(item.id) ===
            Number(
              loadedDraft.product_id
            )
        ) || null;

      setProduct(matchedProduct);

      /*
       * Automatically create a useful campaign name.
       */
      if (matchedProduct) {
        setCampaignName(
          `${matchedProduct.product_name} - ${loadedDraft.platform} Campaign`
        );
      } else {
        setCampaignName(
          `${loadedDraft.platform} AI Campaign`
        );
      }
    } catch (err) {
      console.error(
        "Campaign builder error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalBudget = useMemo(() => {
    if (budget.trim() === "") {
      return 0;
    }

    const value = Number(budget);

    if (
      Number.isNaN(value) ||
      value <= 0
    ) {
      return 0;
    }

    return value;
  }, [budget]);

  const dailyBudget = useMemo(() => {
    const days =
      Number(durationDays);

    if (
      !totalBudget ||
      Number.isNaN(days) ||
      days <= 0
    ) {
      return 0;
    }

    return totalBudget / days;
  }, [totalBudget, durationDays]);

  async function createCampaign() {
    if (!draft) {
      setError(
        "Advertisement draft is missing."
      );
      return;
    }

    const token = getAuthToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setError("");

    /*
     * Validate campaign name.
     */
    if (!campaignName.trim()) {
      setError(
        "Please enter a campaign name."
      );
      return;
    }

    /*
     * Validate budget.
     */
    if (budget.trim() !== "") {
      const numericBudget =
        Number(budget);

      if (
        Number.isNaN(
          numericBudget
        ) ||
        numericBudget < 0
      ) {
        setError(
          "Please enter a valid budget."
        );
        return;
      }
    }

    /*
     * Validate duration.
     */
    if (durationDays.trim() !== "") {
      const numericDuration =
        Number(durationDays);

      if (
        Number.isNaN(
          numericDuration
        ) ||
        numericDuration < 1
      ) {
        setError(
          "Campaign duration must be at least 1 day."
        );
        return;
      }
    }

    /*
     * Validate dates.
     */
    if (
      startDate &&
      endDate &&
      new Date(endDate) <
        new Date(startDate)
    ) {
      setError(
        "End date cannot be before start date."
      );
      return;
    }

    /*
     * Build the exact payload expected
     * by CampaignCreate.
     */
    const payload = {
      ad_draft_id: Number(
        draft.id
      ),

      product_id: Number(
        draft.product_id
      ),

      campaign_name:
        campaignName.trim(),

      platform:
        draft.platform,

      objective:
        draft.objective,

      budget:
        budget.trim() === ""
          ? null
          : Number(budget),

      duration_days:
        durationDays.trim() === ""
          ? null
          : Number(durationDays),

      start_date:
        formatDateForAPI(
          startDate
        ),

      end_date:
        formatDateForAPI(
          endDate,
          true
        ),

      status: "draft",
    };

    console.log(
      "Campaign payload:",
      payload
    );

    setCreating(true);

    try {
      const response =
        await fetch(
          `${API_URL}/campaigns/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      console.log(
        "Campaign API response:",
        {
          status:
            response.status,

          ok:
            response.ok,

          data,
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

      if (!response.ok) {
        let errorMessage =
          "Failed to create campaign.";

        /*
         * FastAPI normal string error.
         */
        if (
          typeof data?.detail ===
          "string"
        ) {
          errorMessage =
            data.detail;
        }

        /*
         * FastAPI validation error.
         */
        else if (
          Array.isArray(
            data?.detail
          )
        ) {
          errorMessage =
            data.detail
              .map(
                (
                  item: any
                ) => {
                  const location =
                    Array.isArray(
                      item?.loc
                    )
                      ? item.loc.join(
                          " → "
                        )
                      : "";

                  const message =
                    item?.msg ||
                    item?.message ||
                    "Validation error";

                  return location
                    ? `${location}: ${message}`
                    : message;
                }
              )
              .join("\n");
        }

        /*
         * Object error.
         */
        else if (
          data?.detail &&
          typeof data.detail ===
            "object"
        ) {
          errorMessage =
            JSON.stringify(
              data.detail,
              null,
              2
            );
        }

        console.error(
          "Campaign creation failed:",
          {
            status:
              response.status,
            data,
            payload,
          }
        );

        throw new Error(
          errorMessage
        );
      }

      /*
       * Campaign successfully created.
       */
      const createdCampaign =
        data?.campaign;

      console.log(
        "Campaign created successfully:",
        createdCampaign
      );

      router.push(
        "/campaigns"
      );
    } catch (err) {
      console.error(
        "Create campaign error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create campaign."
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-400" />

            <p className="text-sm text-slate-400">
              Loading campaign builder...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 text-4xl">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold">
            Campaign Draft Not Found
          </h1>

          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400">
            {error ||
              "The selected advertisement draft could not be loaded."}
          </p>

          <Link
            href="/ad-drafts"
            className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold"
          >
            ← Back to Ad Drafts
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[450px] w-[450px] rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute bottom-[-10%] right-[-10%] h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute left-[45%] top-[30%] h-[250px] w-[250px] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-[#070b1c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/ad-drafts"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
            >
              ←
            </Link>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-400">
                Campaign Studio
              </p>

              <h1 className="mt-1 text-xl font-bold sm:text-2xl">
                Create Campaign
              </h1>
            </div>
          </div>

          <div className="hidden rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-xs text-purple-300 sm:block">
            AI Draft → Campaign
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 whitespace-pre-wrap rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300">
            <p className="font-semibold">
              Campaign creation failed
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        )}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-sm text-purple-300">
              01
            </span>

            <span className="text-sm font-semibold text-slate-300">
              Campaign Configuration
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Your AI-generated advertisement is connected
            to this campaign. Configure the campaign settings
            before saving it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-purple-400">
                  Campaign Identity
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Name your campaign
                </h2>
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Campaign Name
              </label>

              <input
                value={campaignName}
                onChange={(event) =>
                  setCampaignName(
                    event.target.value
                  )
                }
                placeholder="e.g. Campus Coffee Week"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500/50 focus:bg-black/30"
              />

              <p className="mt-2 text-xs text-slate-500">
                Give your campaign a memorable name.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-blue-400">
                  Campaign Parameters
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Budget & Duration
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Total Budget
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      ৳
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={budget}
                      onChange={(event) =>
                        setBudget(
                          event.target.value
                        )
                      }
                      placeholder="3000"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500/50"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Optional campaign budget.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Duration
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(event) =>
                        setDurationDays(
                          event.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 pr-20 text-sm text-white outline-none transition focus:border-blue-500/50"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                      days
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Recommended: 7 days.
                  </p>
                </div>
              </div>

              {totalBudget > 0 && (
                <div className="mt-5 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Estimated daily budget
                    </span>

                    <span className="font-semibold text-blue-300">
                      ৳{" "}
                      {dailyBudget.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wider text-cyan-400">
                  Schedule
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Campaign dates
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Dates are optional for now.
              </p>
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-white/[0.02] to-blue-500/10 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-xl">
                  🤖
                </div>

                <div>
                  <p className="text-sm font-semibold text-purple-300">
                    AI Campaign Intelligence
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    This campaign is connected to your
                    AI-generated advertisement. Later,
                    BizPilot AI can automatically schedule
                    content, publish it, monitor engagement,
                    and optimize campaign performance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="border-b border-white/10 bg-black/10 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      AI Advertisement
                    </p>

                    <h2 className="mt-1 text-lg font-bold">
                      Campaign Preview
                    </h2>
                  </div>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-300">
                    READY
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-300">
                    {draft.platform}
                  </span>

                  <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[11px] text-purple-300">
                    {draft.objective}
                  </span>

                  <span className="rounded-lg border border-pink-500/20 bg-pink-500/10 px-2.5 py-1 text-[11px] text-pink-300">
                    {draft.tone}
                  </span>
                </div>

                {product && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Product
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="font-semibold">
                        {product.product_name}
                      </p>

                      <span className="text-sm font-medium text-purple-300">
                        ৳{" "}
                        {Number(
                          product.price
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Headline
                  </p>

                  <h3 className="mt-2 text-lg font-bold leading-7">
                    {draft.headline}
                  </h3>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Primary Text
                  </p>

                  <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
                    {draft.primary_text}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {draft.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-500/70">
                    Call To Action
                  </p>

                  <p className="mt-1 font-semibold text-emerald-300">
                    {draft.cta}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    Target Audience
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {draft.audience}
                  </p>
                </div>

                {draft.hashtags?.length >
                  0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Hashtags
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {draft.hashtags.map(
                        (
                          hashtag,
                          index
                        ) => (
                          <span
                            key={`${hashtag}-${index}`}
                            className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] text-blue-300"
                          >
                            {hashtag}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-purple-400">
                    AI Recommendation
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Best time:{" "}
                    <span className="text-slate-200">
                      {draft.best_time}
                    </span>
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Strategy:{" "}
                    <span className="text-slate-300">
                      {draft.strategy}
                    </span>
                  </p>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <button
                    onClick={
                      createCampaign
                    }
                    disabled={creating}
                    className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 px-5 py-4 text-sm font-bold shadow-xl shadow-purple-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating
                      ? "Creating Campaign..."
                      : "🚀 Create Campaign"}
                  </button>

                  <Link
                    href="/ad-drafts"
                    className="mt-3 block w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center text-sm font-medium text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
