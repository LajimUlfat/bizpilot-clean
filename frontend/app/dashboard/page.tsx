"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  full_name: string;
  email: string;
};

type Business = {
  id: number;
  business_name: string;
  business_type: string;
  description?: string | null;
  website?: string | null;
};

type Product = {
  id: number;
  product_name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [productsLoading, setProductsLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const userResponse = await fetch(
          `${API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!userResponse.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");

          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("user");

          router.replace("/login");
          return;
        }

        const userData = await userResponse.json();

        setUser(userData);

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
          localStorage.removeItem("user");

          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("user");

          router.replace("/login");
          return;
        }

        if (!businessResponse.ok) {
          setBusiness(null);
          setProducts([]);
          setLoading(false);
          return;
        }

        const businessData =
          await businessResponse.json();

        setBusiness(businessData);

        setProductsLoading(true);

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
          localStorage.removeItem("user");

          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("user");

          router.replace("/login");
          return;
        }

        if (productsResponse.ok) {
          const productsData =
            await productsResponse.json();

          setProducts(
            Array.isArray(productsData)
              ? productsData
              : productsData.products || []
          );
        } else {
          setProducts([]);
        }

        setProductsLoading(false);
      } catch (err) {
        console.error(
          "Dashboard error:",
          err
        );

        setError(
          "Something went wrong while loading your dashboard."
        );

        setProducts([]);
        setProductsLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");

    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="text-slate-400">
            Loading BizPilot AI...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-slate-800 bg-slate-900 lg:flex">

        <div className="border-b border-slate-800 px-6 py-6">
          <Link
            href="/dashboard"
            className="text-2xl font-bold tracking-tight"
          >
            <span className="text-blue-500">
              BizPilot
            </span>{" "}
            <span className="text-white">
              AI
            </span>
          </Link>

          <p className="mt-1 text-xs text-slate-500">
            AI Business Co-Pilot
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">

          {/* Overview */}

          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Overview
          </p>

          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-600/10 px-3 py-2.5 text-blue-400"
          >
            <span>📊</span>

            <span className="text-sm font-medium">
              Dashboard
            </span>
          </Link>

          {/* Business */}

          <p className="mb-2 px-3 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Business
          </p>

          <Link
            href="/business/setup"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <span>🏢</span>

            <span className="text-sm">
              Business
            </span>
          </Link>

          <Link
            href="/products"
            className="flex items-center justify-between rounded-xl px-3 py-2.5 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <span>📦</span>

              <span className="text-sm">
                Products
              </span>
            </div>

            {business && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                {products.length}
              </span>
            )}
          </Link>

          <DashboardNavItem
            icon="👥"
            label="Customers"
            badge="Soon"
          />

          <DashboardNavItem
            icon="🛒"
            label="Orders"
            badge="Soon"
          />

          {/* AI Tools */}

          <p className="mb-2 px-3 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            AI Tools
          </p>

          <DashboardNavItem
            icon="🤖"
            label="AI Studio"
            badge="Soon"
          />

          <Link
            href="/ai-ad-generation"
            className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2.5 text-indigo-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/15"
          >
            <div className="flex items-center gap-3">
              <span>📣</span>

              <span className="text-sm font-medium">
                AI Ad Generation
              </span>
            </div>

            <span className="rounded-lg bg-indigo-500/10 px-2 py-1 text-[10px] text-indigo-300">
              AI
            </span>
          </Link>

          {/* AD DRAFTS */}

          <Link
            href="/ad-drafts"
            className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2.5 text-purple-300 transition hover:border-purple-500/40 hover:bg-purple-500/15"
          >
            <div className="flex items-center gap-3">
              <span>📝</span>

              <span className="text-sm font-medium">
                Ad Drafts
              </span>
            </div>

            <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-[10px] text-purple-300">
              Drafts
            </span>
          </Link>

          <DashboardNavItem
            icon="✍️"
            label="AI Content"
            badge="Soon"
          />

          <DashboardNavItem
            icon="🧠"
            label="AI Business Strategy"
            badge="Soon"
          />

          <DashboardNavItem
            icon="💬"
            label="AI Customer Support"
            badge="Soon"
          />

          {/* Growth */}

          <p className="mb-2 px-3 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Growth
          </p>

          {/* ACTIVE CAMPAIGNS */}

          <Link
            href="/campaigns"
            className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2.5 text-green-300 transition hover:border-green-500/40 hover:bg-green-500/15"
          >
            <div className="flex items-center gap-3">
              <span>🎯</span>

              <span className="text-sm font-medium">
                Campaigns
              </span>
            </div>

            <span className="rounded-lg bg-green-500/10 px-2 py-1 text-[10px] text-green-300">
              Active
            </span>
          </Link>

          <DashboardNavItem
            icon="⚡"
            label="Automation"
            badge="Soon"
          />

          <DashboardNavItem
            icon="📈"
            label="Sales Intelligence"
            badge="Soon"
          />

          <DashboardNavItem
            icon="📊"
            label="Analytics"
            badge="Soon"
          />

          {/* AI Knowledge */}

          <p className="mb-2 px-3 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            AI Knowledge
          </p>

          <DashboardNavItem
            icon="📚"
            label="Knowledge Base"
            badge="Soon"
          />

          <DashboardNavItem
            icon="🔎"
            label="RAG / Documents"
            badge="Soon"
          />

          {/* System */}

          <p className="mb-2 px-3 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            System
          </p>

          <DashboardNavItem
            icon="💳"
            label="Subscription"
            badge="Soon"
          />

          <DashboardNavItem
            icon="⚙️"
            label="Settings"
            badge="Soon"
          />
        </nav>

        {/* User / Logout */}

        <div className="border-t border-slate-800 p-4">

          <div className="mb-4 flex items-center gap-3 px-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/20 bg-blue-600/20">
              👤
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.full_name}
              </p>

              <p className="truncate text-xs text-slate-500">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur lg:hidden">

        <div className="flex items-center justify-between px-5 py-4">

          <Link
            href="/dashboard"
            className="text-xl font-bold"
          >
            <span className="text-blue-500">
              BizPilot
            </span>{" "}
            AI
          </Link>

          <button
            onClick={handleLogout}
            className="text-sm text-slate-400"
          >
            Logout
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 pb-4">

          <Link
            href="/dashboard"
            className="shrink-0 rounded-lg bg-blue-600/10 px-3 py-2 text-xs text-blue-400"
          >
            Dashboard
          </Link>

          <Link
            href="/business/setup"
            className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-400"
          >
            Business
          </Link>

          <Link
            href="/products"
            className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-400"
          >
            Products
          </Link>

          <Link
            href="/ai-ad-generation"
            className="shrink-0 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300"
          >
            AI Ads
          </Link>

          <Link
            href="/ad-drafts"
            className="shrink-0 rounded-lg bg-purple-500/10 px-3 py-2 text-xs text-purple-300"
          >
            Drafts
          </Link>

          {/* MOBILE CAMPAIGNS */}

          <Link
            href="/campaigns"
            className="shrink-0 rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-300"
          >
            Campaigns
          </Link>
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="min-h-screen lg:ml-72">

        {/* Header */}

        <header className="border-b border-slate-800">

          <div className="px-5 py-6 md:px-8 xl:px-10">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="mb-1 text-sm text-slate-500">
                  Welcome back
                </p>

                <h1 className="text-2xl font-bold md:text-3xl">
                  {user?.full_name || "User"} 👋
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Your AI-powered business command center.
                </p>
              </div>

              {business && (
                <Link
                  href="/products/new"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
                >
                  + Add Product
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="px-5 py-8 md:px-8 xl:px-10">

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {!business ? (
            <NewUserDashboard />
          ) : (
            <>
              {/* =================================================
                  BUSINESS OVERVIEW
              ================================================== */}

              <section className="mb-8">

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-7">

                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                      <div className="mb-3 flex items-center gap-2">

                        <span className="h-2 w-2 rounded-full bg-green-500" />

                        <span className="text-xs font-semibold uppercase tracking-wider text-green-400">
                          Business Active
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold md:text-3xl">
                        {business.business_name}
                      </h2>

                      <p className="mt-2 text-slate-400">
                        {business.business_type}
                      </p>
                    </div>

                    <Link
                      href="/business/setup"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-2.5 text-sm transition hover:bg-slate-800"
                    >
                      Manage Business →
                    </Link>
                  </div>

                  {business.description && (
                    <p className="mt-6 max-w-4xl border-t border-slate-800 pt-5 text-sm leading-7 text-slate-400">
                      {business.description}
                    </p>
                  )}
                </div>
              </section>

              {/* =================================================
                  STATS
              ================================================== */}

              <section className="mb-10">

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                  <StatCard
                    icon="📦"
                    title="Products"
                    value={
                      productsLoading
                        ? "..."
                        : products.length.toString()
                    }
                    subtitle={
                      products.length === 0
                        ? "No products yet"
                        : "View product catalog"
                    }
                    href="/products"
                  />

                  <StatCard
                    icon="🎯"
                    title="Campaigns"
                    value="→"
                    subtitle="View your marketing campaigns"
                    href="/campaigns"
                  />

                  <StatCard
                    icon="👥"
                    title="Customers"
                    value="0"
                    subtitle="Customer system coming soon"
                  />

                  <StatCard
                    icon="📈"
                    title="Revenue"
                    value="৳0"
                    subtitle="Analytics coming soon"
                  />
                </div>
              </section>

              {/* =================================================
                  AI COMMAND CENTER
              ================================================== */}

              <section className="mb-10">

                <div className="mb-5 flex items-end justify-between">

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                      AI Command Center
                    </p>

                    <h2 className="text-2xl font-bold">
                      Grow your business with AI
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Your future AI-powered business toolkit.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {/* AI AD GENERATION */}

                  <Link
                    href="/ai-ad-generation"
                    className="block h-full"
                  >
                    <FeatureCard
                      icon="📣"
                      title="AI Ad Generation"
                      description="Generate Facebook, Instagram and other promotional ad copy using your business and product data."
                      badge="Open AI Tool"
                      active
                    />
                  </Link>

                  {/* AD DRAFTS */}

                  <Link
                    href="/ad-drafts"
                    className="block h-full"
                  >
                    <FeatureCard
                      icon="📝"
                      title="Ad Drafts"
                      description="View, manage, copy and edit your previously saved AI advertisements."
                      badge="Open Drafts"
                      active
                    />
                  </Link>

                  {/* CAMPAIGNS */}

                  <Link
                    href="/campaigns"
                    className="block h-full"
                  >
                    <FeatureCard
                      icon="🎯"
                      title="Campaigns"
                      description="Create, manage and monitor marketing campaigns generated from your AI advertisements."
                      badge="Open Campaigns"
                      active
                    />
                  </Link>

                  <FeatureCard
                    icon="✍️"
                    title="AI Content Studio"
                    description="Create product descriptions, social posts, captions, promotional content and marketing copy."
                    badge="Coming Soon"
                  />

                  <FeatureCard
                    icon="🧠"
                    title="AI Business Strategy"
                    description="Get AI-powered business ideas, marketing strategies, positioning and growth recommendations."
                    badge="Coming Soon"
                  />

                  <FeatureCard
                    icon="💬"
                    title="AI Customer Support"
                    description="Build an AI assistant that can answer customer questions using your business knowledge."
                    badge="Coming Soon"
                  />

                  <FeatureCard
                    icon="🤖"
                    title="AI Agent"
                    description="Create an intelligent business agent that can reason, retrieve information and perform business tasks."
                    badge="Coming Soon"
                  />
                </div>
              </section>

              {/* =================================================
                  BUSINESS MANAGEMENT
              ================================================== */}

              <section className="mb-10">

                <div className="mb-5">

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                    Business Management
                  </p>

                  <h2 className="text-2xl font-bold">
                    Manage your business
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                  <ManagementCard
                    icon="📦"
                    title="Products"
                    description={
                      products.length === 0
                        ? "Add your first product."
                        : `${products.length} product${
                            products.length !== 1
                              ? "s"
                              : ""
                          } in your catalog.`
                    }
                    href="/products"
                    active
                  />

                  <ManagementCard
                    icon="🎯"
                    title="Campaigns"
                    description="Create and manage marketing campaigns from your saved AI advertisements."
                    href="/campaigns"
                    active
                  />

                  <ManagementCard
                    icon="👥"
                    title="Customers"
                    description="Manage customer profiles, conversations and relationships."
                  />

                  <ManagementCard
                    icon="🛒"
                    title="Orders"
                    description="Track orders, order items, sales and fulfillment."
                  />
                </div>
              </section>

              {/* =================================================
                  GROWTH & INTELLIGENCE
              ================================================== */}

              <section className="mb-10">

                <div className="mb-5">

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400">
                    Growth & Intelligence
                  </p>

                  <h2 className="text-2xl font-bold">
                    Business intelligence
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Turn your business data into actionable
                    insights.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                  <InsightCard
                    icon="📊"
                    title="Analytics"
                    description="Revenue, orders, customers and business performance."
                  />

                  <InsightCard
                    icon="📈"
                    title="Sales Intelligence"
                    description="Identify sales trends, best products and growth opportunities."
                  />

                  {/* ACTIVE CAMPAIGNS */}

                  <Link
                    href="/campaigns"
                    className="block h-full"
                  >
                    <InsightCard
                      icon="🎯"
                      title="Campaigns"
                      description="Create and monitor your marketing campaigns."
                      active
                    />
                  </Link>

                  <InsightCard
                    icon="⚡"
                    title="Automation"
                    description="Automate repetitive business and marketing workflows."
                  />
                </div>
              </section>

              {/* =================================================
                  AI KNOWLEDGE
              ================================================== */}

              <section className="mb-10">

                <div className="mb-5">

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                    AI Knowledge
                  </p>

                  <h2 className="text-2xl font-bold">
                    Teach BizPilot about your business
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Your future AI agents will use your business
                    knowledge to provide better answers.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-7">

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

                    <KnowledgeItem
                      icon="📄"
                      title="Documents"
                      description="Upload business documents and information."
                    />

                    <KnowledgeItem
                      icon="🔎"
                      title="RAG Search"
                      description="AI retrieves relevant information from your knowledge base."
                    />

                    <KnowledgeItem
                      icon="🧠"
                      title="Business Memory"
                      description="Give your AI assistant reliable business context."
                    />
                  </div>

                  <div className="mt-6 border-t border-slate-800 pt-5">

                    <span className="inline-flex rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-400">
                      🚧 Knowledge Base coming soon
                    </span>
                  </div>
                </div>
              </section>

              {/* =================================================
                  QUICK ACTIONS
              ================================================== */}

              <section className="mb-10">

                <div className="mb-5">

                  <h2 className="text-xl font-bold">
                    Quick Actions
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">

                  <QuickAction
                    icon="➕"
                    title="Add Product"
                    href="/products/new"
                  />

                  <QuickAction
                    icon="🏢"
                    title="Edit Business"
                    href="/business/setup"
                  />

                  <QuickAction
                    icon="📦"
                    title="View Products"
                    href="/products"
                  />

                  <QuickAction
                    icon="📣"
                    title="Generate AI Ad"
                    href="/ai-ad-generation"
                  />

                  <QuickAction
                    icon="📝"
                    title="View Ad Drafts"
                    href="/ad-drafts"
                  />

                  {/* VIEW CAMPAIGNS */}

                  <QuickAction
                    icon="🎯"
                    title="View Campaigns"
                    href="/campaigns"
                  />
                </div>
              </section>

              {/* =================================================
                  PLATFORM
              ================================================== */}

              <section className="mb-10">

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 md:p-8">

                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                        BizPilot AI Platform
                      </p>

                      <h2 className="mb-2 text-2xl font-bold">
                        Your business, powered by AI.
                      </h2>

                      <p className="max-w-2xl text-sm leading-6 text-slate-400">
                        BizPilot AI is being built as a complete
                        AI business co-pilot — from product
                        management and marketing to customer
                        support, automation, analytics and
                        intelligent business decisions.
                      </p>
                    </div>

                    <div className="shrink-0">

                      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-400">
                        🚀 Platform in development
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  SETUP STATUS
              ================================================== */}

              <section>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">

                  <div className="flex items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-lg">
                      ✓
                    </div>

                    <div>

                      <h3 className="mb-1 font-semibold text-green-400">
                        Business setup completed
                      </h3>

                      <p className="text-sm leading-6 text-slate-400">
                        Your business workspace is active.
                        Continue adding products and use the
                        upcoming AI tools to grow your business.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
NEW USER DASHBOARD
========================================================= */

function NewUserDashboard() {
  return (
    <div className="space-y-8">

      <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-7 md:p-10">

        <div className="max-w-3xl">

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400">
            🚀 Welcome to BizPilot AI
          </div>

          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Let's build your business workspace.
          </h2>

          <p className="mb-7 leading-7 text-slate-400">
            You haven't created a business yet. Start by
            setting up your business profile. After that,
            you'll be able to add products and unlock the
            rest of the BizPilot AI platform.
          </p>

          <Link
            href="/business/setup"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500"
          >
            Set Up Business →
          </Link>
        </div>
      </section>

      <section>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <EmptyStat
            icon="📦"
            title="Products"
            value="0"
          />

          <EmptyStat
            icon="👥"
            title="Customers"
            value="0"
          />

          <EmptyStat
            icon="🛒"
            title="Orders"
            value="0"
          />

          <EmptyStat
            icon="📈"
            title="Revenue"
            value="৳0"
          />
        </div>
      </section>

      <section>

        <div className="mb-5">

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            First Steps
          </p>

          <h2 className="text-2xl font-bold">
            Get started with BizPilot AI
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          <Link
            href="/business/setup"
            className="rounded-2xl border border-blue-500/30 bg-slate-900 p-6 transition hover:border-blue-500/60"
          >
            <div className="mb-5 text-3xl">
              🏢
            </div>

            <h3 className="mb-2 text-lg font-semibold">
              Create Business
            </h3>

            <p className="text-sm leading-6 text-slate-400">
              Set up your business profile and create your
              BizPilot workspace.
            </p>

            <p className="mt-5 text-sm text-blue-400">
              Start setup →
            </p>
          </Link>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 opacity-70">

            <div className="mb-5 text-3xl">
              📦
            </div>

            <h3 className="mb-2 text-lg font-semibold">
              Add Products
            </h3>

            <p className="text-sm leading-6 text-slate-500">
              Add your products after creating your business
              workspace.
            </p>

            <p className="mt-5 text-sm text-slate-600">
              Available after setup
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 opacity-70">

            <div className="mb-5 text-3xl">
              🤖
            </div>

            <h3 className="mb-2 text-lg font-semibold">
              AI Business Tools
            </h3>

            <p className="text-sm leading-6 text-slate-500">
              AI ads, content, strategy, automation and
              analytics will become available as the platform
              grows.
            </p>

            <p className="mt-5 text-sm text-slate-600">
              Coming soon
            </p>
          </div>
        </div>
      </section>

      <section>

        <div className="mb-5">

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            Platform
          </p>

          <h2 className="text-2xl font-bold">
            Everything in one place
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">

          {[
            ["📣", "AI Ads"],
            ["✍️", "AI Content"],
            ["🎯", "Campaigns"],
            ["⚡", "Automation"],
            ["📊", "Analytics"],
            ["🤖", "AI Agent"],
          ].map(([icon, title]) => (
            <div
              key={title}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center opacity-70"
            >
              <div className="mb-2 text-2xl">
                {icon}
              </div>

              <p className="text-xs text-slate-400">
                {title}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
SIDEBAR NAV ITEM
========================================================= */

function DashboardNavItem({
  icon,
  label,
  badge,
}: {
  icon: string;
  label: string;
  badge?: string;
}) {
  return (
    <div className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2.5 text-slate-500">

      <div className="flex items-center gap-3">

        <span>{icon}</span>

        <span className="text-sm">
          {label}
        </span>
      </div>

      {badge && (
        <span className="text-[10px] text-slate-600">
          {badge}
        </span>
      )}
    </div>
  );
}

/* =========================================================
STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  subtitle,
  href,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  href?: string;
}) {
  const content = (
    <div className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="mb-3 text-sm text-slate-500">
            {title}
          </p>

          <p className="text-3xl font-bold">
            {value}
          </p>

          <p className="mt-3 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return content;
}

/* =========================================================
EMPTY STAT
========================================================= */

function EmptyStat({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <div className="flex items-start justify-between">

        <div>

          <p className="mb-3 text-sm text-slate-500">
            {title}
          </p>

          <p className="text-3xl font-bold">
            {value}
          </p>

          <p className="mt-3 text-xs text-slate-600">
            Not configured
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
FEATURE CARD
========================================================= */

function FeatureCard({
  icon,
  title,
  description,
  badge,
  active = false,
}: {
  icon: string;
  title: string;
  description: string;
  badge: string;
  active?: boolean;
}) {
  return (
    <div
      className={`group h-full rounded-2xl border bg-slate-900 p-6 transition ${
        active
          ? "border-indigo-500/30 hover:border-indigo-500/60"
          : "border-slate-800 hover:border-blue-500/30"
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
            active
              ? "bg-indigo-500/10"
              : "bg-blue-500/10"
          }`}
        >
          {icon}
        </div>

        <span
          className={`rounded-lg border px-2 py-1 text-[10px] uppercase tracking-wider ${
            active
              ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
              : "border-slate-800 text-slate-600"
          }`}
        >
          {badge}
        </span>
      </div>

      <h3 className="mb-2 mt-5 text-lg font-semibold">
        {title}
      </h3>

      <p className="text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div
        className={`mt-5 text-xs ${
          active
            ? "text-indigo-400"
            : "text-slate-600"
        }`}
      >
        {active
          ? title === "Ad Drafts"
            ? "Open Saved Drafts →"
            : title === "Campaigns"
              ? "Open Campaign Manager →"
              : "Open AI Ad Generator →"
          : "AI module in development"}
      </div>
    </div>
  );
}

/* =========================================================
MANAGEMENT CARD
========================================================= */

function ManagementCard({
  icon,
  title,
  description,
  href,
  active = false,
}: {
  icon: string;
  title: string;
  description: string;
  href?: string;
  active?: boolean;
}) {
  const content = (
    <div
      className={`h-full rounded-2xl border p-6 transition ${
        active
          ? "border-slate-800 bg-slate-900 hover:border-blue-500/40"
          : "border-slate-800 bg-slate-900 opacity-60"
      }`}
    >

      <div className="mb-4 text-3xl">
        {icon}
      </div>

      <h3 className="mb-2 text-lg font-semibold">
        {title}
      </h3>

      <p className="text-sm leading-6 text-slate-500">
        {description}
      </p>

      {active ? (
        <p className="mt-5 text-sm text-blue-400">
          Open →
        </p>
      ) : (
        <p className="mt-5 text-xs text-slate-600">
          Coming soon
        </p>
      )}
    </div>
  );

  if (href && active) {
    return (
      <Link href={href}>
        {content}
      </Link>
    );
  }

  return content;
}

/* =========================================================
INSIGHT CARD
========================================================= */

function InsightCard({
  icon,
  title,
  description,
  active = false,
}: {
  icon: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`h-full rounded-2xl border bg-slate-900 p-6 transition ${
        active
          ? "border-green-500/30 hover:border-green-500/60"
          : "border-slate-800 opacity-75"
      }`}
    >

      <div
        className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
          active
            ? "bg-green-500/10"
            : "bg-slate-800"
        }`}
      >
        {icon}
      </div>

      <h3 className="mb-2 text-lg font-semibold">
        {title}
      </h3>

      <p className="text-sm leading-6 text-slate-500">
        {description}
      </p>

      <p
        className={`mt-5 text-xs ${
          active
            ? "text-green-400"
            : "text-slate-600"
        }`}
      >
        {active
          ? "Open Campaign Manager →"
          : "Coming soon"}
      </p>
    </div>
  );
}

/* =========================================================
KNOWLEDGE ITEM
========================================================= */

function KnowledgeItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div>

      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl">
        {icon}
      </div>

      <h3 className="mb-2 font-semibold">
        {title}
      </h3>

      <p className="text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
QUICK ACTION
========================================================= */

function QuickAction({
  icon,
  title,
  href,
  disabled = false,
}: {
  icon: string;
  title: string;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-4 transition ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-slate-700 hover:bg-slate-800"
      }`}
    >
      <span className="text-xl">
        {icon}
      </span>

      <span className="text-sm font-medium">
        {title}
      </span>
    </div>
  );

  if (disabled || !href) {
    return content;
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}
