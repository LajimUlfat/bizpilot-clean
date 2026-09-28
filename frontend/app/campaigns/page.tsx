"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Campaign = {
  id: number;
  business_id: number;
  ad_draft_id?: number | null;
  product_id?: number | null;

  campaign_name: string;
  platform: string;
  objective: string;

  budget?: number | string | null;
  duration_days?: number | null;

  start_date?: string | null;
  end_date?: string | null;

  status: string;

  created_at?: string;
  updated_at?: string;

  product?: {
    id?: number;
    product_name?: string;
    price?: number | string;
  };

  ad_draft?: {
    id?: number;
    primary_text?: string;
    headline?: string;
    description?: string;
    cta?: string;
    hashtags?: string[];
  };
};

type Product = {
  id: number;
  product_name: string;
  price?: number | string;
};

function getAuthToken() {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    ""
  );
}

function getStatusClasses(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "border-green-500/30 bg-green-500/10 text-green-300";

    case "paused":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

    case "completed":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";

    case "cancelled":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    default:
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
  }
}

function formatDate(date?: string | null) {
  if (!date) return "Not set";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBudget(budget?: number | string | null) {
  if (budget === null || budget === undefined || budget === "") {
    return "Not set";
  }

  const value = Number(budget);

  if (Number.isNaN(value)) {
    return String(budget);
  }

  return `৳${value.toLocaleString("en-BD")}`;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  const [editingCampaign, setEditingCampaign] =
    useState<Campaign | null>(null);

  const [deletingCampaign, setDeletingCampaign] =
    useState<Campaign | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editForm, setEditForm] = useState({
    campaign_name: "",
    platform: "",
    objective: "",
    budget: "",
    duration_days: "",
    start_date: "",
    end_date: "",
    status: "draft",
  });

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const [campaignResponse, productResponse] = await Promise.all([
        fetch(`${API_URL}/campaigns/`, {
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

      if (campaignResponse.status === 401) {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        window.location.href = "/login";
        return;
      }

      if (!campaignResponse.ok) {
        throw new Error("Failed to load campaigns.");
      }

      const campaignData = await campaignResponse.json();
      const productData = await productResponse.json();

      const loadedCampaigns = Array.isArray(campaignData)
        ? campaignData
        : campaignData?.campaigns || [];

      const loadedProducts = Array.isArray(productData)
        ? productData
        : productData?.products || [];

      setCampaigns(loadedCampaigns);
      setProducts(loadedProducts);
    } catch (err) {
      console.error("Campaign loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading campaigns."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getProductName(campaign: Campaign) {
    if (campaign.product?.product_name) {
      return campaign.product.product_name;
    }

    const product = products.find(
      (item) => item.id === campaign.product_id
    );

    return product?.product_name || "Unknown product";
  }

  function openEdit(campaign: Campaign) {
    setEditingCampaign(campaign);

    setEditForm({
      campaign_name: campaign.campaign_name || "",
      platform: campaign.platform || "",
      objective: campaign.objective || "",
      budget:
        campaign.budget === null || campaign.budget === undefined
          ? ""
          : String(campaign.budget),
      duration_days:
        campaign.duration_days === null ||
        campaign.duration_days === undefined
          ? ""
          : String(campaign.duration_days),
      start_date: campaign.start_date
        ? campaign.start_date.slice(0, 10)
        : "",
      end_date: campaign.end_date
        ? campaign.end_date.slice(0, 10)
        : "",
      status: campaign.status || "draft",
    });

    setSelectedCampaign(null);
  }

  function formatDateForAPI(
    date: string,
    endOfDay = false
  ): string | null {
    if (!date) return null;

    return endOfDay
      ? `${date}T23:59:59`
      : `${date}T00:00:00`;
  }

  async function saveCampaign() {
    if (!editingCampaign) return;

    if (!editForm.campaign_name.trim()) {
      alert("Campaign name is required.");
      return;
    }

    if (
      editForm.budget.trim() !== "" &&
      Number(editForm.budget) < 0
    ) {
      alert("Budget cannot be negative.");
      return;
    }

    if (
      editForm.duration_days.trim() !== "" &&
      Number(editForm.duration_days) < 1
    ) {
      alert("Duration must be at least 1 day.");
      return;
    }

    if (
      editForm.start_date &&
      editForm.end_date &&
      editForm.end_date < editForm.start_date
    ) {
      alert("End date cannot be before start date.");
      return;
    }

    try {
      setSaving(true);

      const token = getAuthToken();

      const payload = {
        campaign_name: editForm.campaign_name.trim(),
        platform: editForm.platform.trim(),
        objective: editForm.objective.trim(),

        budget:
          editForm.budget.trim() === ""
            ? null
            : Number(editForm.budget),

        duration_days:
          editForm.duration_days.trim() === ""
            ? null
            : Number(editForm.duration_days),

        start_date: formatDateForAPI(editForm.start_date),
        end_date: formatDateForAPI(editForm.end_date, true),

        status: editForm.status,
      };

      console.log("Campaign update payload:", payload);

      const response = await fetch(
        `${API_URL}/campaigns/${editingCampaign.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      console.log("Campaign update response:", data);

      if (!response.ok) {
        let message = "Failed to update campaign.";

        if (Array.isArray(data?.detail)) {
          message = data.detail
            .map((item: any) => {
              if (typeof item === "string") return item;

              return (
                item?.msg ||
                item?.message ||
                "Validation error"
              );
            })
            .join(", ");
        } else if (typeof data?.detail === "string") {
          message = data.detail;
        } else if (data?.message) {
          message = data.message;
        }

        throw new Error(message);
      }

      const updatedCampaign =
        data?.campaign || data;

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === editingCampaign.id
            ? {
                ...campaign,
                ...updatedCampaign,
              }
            : campaign
        )
      );

      setEditingCampaign(null);
    } catch (err) {
      console.error("Campaign update error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to update campaign."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCampaign() {
    if (!deletingCampaign) return;

    try {
      setDeleting(true);

      const token = getAuthToken();

      const response = await fetch(
        `${API_URL}/campaigns/${deletingCampaign.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Failed to delete campaign."
        );
      }

      setCampaigns((current) =>
        current.filter(
          (campaign) =>
            campaign.id !== deletingCampaign.id
        )
      );

      setDeletingCampaign(null);
      setSelectedCampaign(null);
    } catch (err) {
      console.error("Campaign delete error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete campaign."
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesSearch =
        !query ||
        campaign.campaign_name
          ?.toLowerCase()
          .includes(query) ||
        campaign.platform
          ?.toLowerCase()
          .includes(query) ||
        campaign.objective
          ?.toLowerCase()
          .includes(query) ||
        getProductName(campaign)
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        campaign.status?.toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter, products]);

  const totalBudget = campaigns.reduce((sum, campaign) => {
    const value = Number(campaign.budget || 0);

    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

  const activeCampaigns = campaigns.filter(
    (campaign) =>
      campaign.status?.toLowerCase() === "active"
  ).length;

  const draftCampaigns = campaigns.filter(
    (campaign) =>
      campaign.status?.toLowerCase() === "draft"
  ).length;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-[350px] w-[350px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute right-[-100px] top-[200px] h-[350px] w-[350px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-150px] left-[35%] h-[350px] w-[350px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-purple-300">
              <Link
                href="/dashboard"
                className="transition hover:text-white"
              >
                Dashboard
              </Link>

              <span className="text-gray-600">/</span>

              <span>Campaigns</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Campaign Manager
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
              Manage your AI-generated marketing campaigns,
              budgets, platforms and campaign status from one
              place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/ad-drafts"
              className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-semibold text-purple-300 transition hover:border-purple-500/40 hover:bg-purple-500/15"
            >
              ✨ Create from Ad Draft
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="🎯"
            title="Total Campaigns"
            value={campaigns.length}
            subtitle="All marketing campaigns"
          />

          <StatCard
            icon="🚀"
            title="Active"
            value={activeCampaigns}
            subtitle="Currently running"
          />

          <StatCard
            icon="📝"
            title="Drafts"
            value={draftCampaigns}
            subtitle="Not published yet"
          />

          <StatCard
            icon="💰"
            title="Total Budget"
            value={formatBudget(totalBudget)}
            subtitle="Combined campaign budget"
          />
        </section>

        {/* Toolbar */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                🔎
              </span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search campaigns..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                ["all", "All"],
                ["draft", "Draft"],
                ["active", "Active"],
                ["paused", "Paused"],
                ["completed", "Completed"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    statusFilter === value
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                      : "border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-purple-500" />

            <p className="text-sm text-gray-400">
              Loading campaigns...
            </p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-3xl">
              🎯
            </div>

            <h2 className="text-xl font-bold">
              {campaigns.length === 0
                ? "No campaigns yet"
                : "No campaigns found"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {campaigns.length === 0
                ? "Create an AI advertisement first, save it as a draft, then turn that draft into a marketing campaign."
                : "Try another search term or change the status filter."}
            </p>

            {campaigns.length === 0 && (
              <Link
                href="/ad-drafts"
                className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-purple-500/20 transition hover:scale-[1.02]"
              >
                View Ad Drafts →
              </Link>
            )}
          </div>
        ) : (
          /* Campaign List */
          <section className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition hover:border-purple-500/20 hover:bg-white/[0.045]"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  {/* Main */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold text-white">
                        {campaign.campaign_name}
                      </h2>

                      <span
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                      <span>
                        🛍️ {getProductName(campaign)}
                      </span>

                      <span>
                        📱 {campaign.platform}
                      </span>

                      <span>
                        🎯 {campaign.objective}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-[520px]">
                    <InfoItem
                      label="Budget"
                      value={formatBudget(campaign.budget)}
                    />

                    <InfoItem
                      label="Duration"
                      value={
                        campaign.duration_days
                          ? `${campaign.duration_days} days`
                          : "Not set"
                      }
                    />

                    <InfoItem
                      label="Start"
                      value={formatDate(
                        campaign.start_date
                      )}
                    />

                    <InfoItem
                      label="End"
                      value={formatDate(
                        campaign.end_date
                      )}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                  <button
                    onClick={() =>
                      setSelectedCampaign(campaign)
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    👁 View
                  </button>

                  <button
                    onClick={() => openEdit(campaign)}
                    className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-300 transition hover:border-blue-500/40 hover:bg-blue-500/15"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() =>
                      setDeletingCampaign(campaign)
                    }
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:border-red-500/40 hover:bg-red-500/15"
                  >
                    🗑 Delete
                  </button>

                  {campaign.ad_draft_id && (
                    <Link
                      href={`/campaigns/new?draft_id=${campaign.ad_draft_id}`}
                      className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2.5 text-xs font-semibold text-purple-300 transition hover:border-purple-500/40 hover:bg-purple-500/15"
                    >
                      🚀 Create Another
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* View Modal */}
      {selectedCampaign && (
        <Modal
          title="Campaign Details"
          onClose={() => setSelectedCampaign(null)}
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Campaign
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {selectedCampaign.campaign_name}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailBox
                label="Product"
                value={getProductName(selectedCampaign)}
              />

              <DetailBox
                label="Platform"
                value={selectedCampaign.platform}
              />

              <DetailBox
                label="Objective"
                value={selectedCampaign.objective}
              />

              <DetailBox
                label="Status"
                value={selectedCampaign.status}
              />

              <DetailBox
                label="Budget"
                value={formatBudget(
                  selectedCampaign.budget
                )}
              />

              <DetailBox
                label="Duration"
                value={
                  selectedCampaign.duration_days
                    ? `${selectedCampaign.duration_days} days`
                    : "Not set"
                }
              />

              <DetailBox
                label="Start date"
                value={formatDate(
                  selectedCampaign.start_date
                )}
              />

              <DetailBox
                label="End date"
                value={formatDate(
                  selectedCampaign.end_date
                )}
              />
            </div>

            {selectedCampaign.ad_draft && (
              <div className="rounded-2xl border border-purple-500/10 bg-purple-500/5 p-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-purple-300">
                  AI Advertisement
                </p>

                {selectedCampaign.ad_draft.headline && (
                  <h3 className="font-bold">
                    {selectedCampaign.ad_draft.headline}
                  </h3>
                )}

                {selectedCampaign.ad_draft.primary_text && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                    {selectedCampaign.ad_draft.primary_text}
                  </p>
                )}

                {selectedCampaign.ad_draft.cta && (
                  <div className="mt-3 inline-flex rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300">
                    CTA: {selectedCampaign.ad_draft.cta}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() =>
                  openEdit(selectedCampaign)
                }
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-semibold shadow-lg shadow-purple-500/20"
              >
                ✏️ Edit Campaign
              </button>

              <button
                onClick={() =>
                  setDeletingCampaign(selectedCampaign)
                }
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300"
              >
                🗑
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingCampaign && (
        <Modal
          title="Edit Campaign"
          onClose={() =>
            saving ? null : setEditingCampaign(null)
          }
        >
          <div className="space-y-4">
            <Field
              label="Campaign name"
              value={editForm.campaign_name}
              onChange={(value) =>
                setEditForm((current) => ({
                  ...current,
                  campaign_name: value,
                }))
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Platform"
                value={editForm.platform}
                options={[
                  "Facebook",
                  "Instagram",
                  "Facebook + Instagram",
                ]}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    platform: value,
                  }))
                }
              />

              <SelectField
                label="Objective"
                value={editForm.objective}
                options={[
                  "Sales",
                  "Traffic",
                  "Engagement",
                  "Brand Awareness",
                ]}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    objective: value,
                  }))
                }
              />

              <Field
                label="Budget (৳)"
                type="number"
                value={editForm.budget}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    budget: value,
                  }))
                }
              />

              <Field
                label="Duration (days)"
                type="number"
                value={editForm.duration_days}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    duration_days: value,
                  }))
                }
              />

              <Field
                label="Start date"
                type="date"
                value={editForm.start_date}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    start_date: value,
                  }))
                }
              />

              <Field
                label="End date"
                type="date"
                value={editForm.end_date}
                onChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    end_date: value,
                  }))
                }
              />

              <div className="sm:col-span-2">
                <SelectField
                  label="Status"
                  value={editForm.status}
                  options={[
                    "draft",
                    "active",
                    "paused",
                    "completed",
                    "cancelled",
                  ]}
                  onChange={(value) =>
                    setEditForm((current) => ({
                      ...current,
                      status: value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/5 pt-4">
              <button
                onClick={() =>
                  setEditingCampaign(null)
                }
                disabled={saving}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={saveCampaign}
                disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-semibold shadow-lg shadow-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {deletingCampaign && (
        <Modal
          title="Delete Campaign?"
          onClose={() =>
            deleting ? null : setDeletingCampaign(null)
          }
        >
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-3xl">
              🗑
            </div>

            <h3 className="text-lg font-bold">
              {deletingCampaign.campaign_name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This campaign will be permanently removed
              from your campaign manager.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() =>
                  setDeletingCampaign(null)
                }
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={deleteCampaign}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Campaign"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-600">
            {subtitle}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/10 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-gray-300">
        {value}
      </p>
    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-300">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-gray-400">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/40"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-gray-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-white/10 bg-[#0a0f20] px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500/40"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#0a0f20]"
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#080d1c] shadow-2xl shadow-black/50">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/5 bg-[#080d1c]/95 px-5 py-4 backdrop-blur-xl">
          <h2 className="text-lg font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
