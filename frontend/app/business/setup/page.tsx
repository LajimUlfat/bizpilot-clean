"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Business = {
  id: number;
  business_name: string;
  business_type: string;
  description: string | null;
  website: string | null;
  user_id: number;
};

export default function BusinessSetupPage() {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBusiness() {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/businesses/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          setBusiness(data);

          setBusinessName(data.business_name || "");
          setBusinessType(data.business_type || "");
          setDescription(data.description || "");
          setWebsite(data.website || "");
        } else if (response.status === 404) {
          // No business created yet
          setBusiness(null);
        } else {
          throw new Error("Failed to load business information");
        }
      } catch (err) {
        console.error(err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/businesses/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            business_name: businessName,
            business_type: businessType,
            description: description || null,
            website: website || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create business"
        );
      }

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleOutsideClick(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    if (e.target === e.currentTarget) {
      router.push("/dashboard");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-400">
          Loading business information...
        </div>
      </main>
    );
  }

  return (
    <main
      onClick={handleOutsideClick}
      className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12 cursor-default"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
      >

        {/* Header */}
        <div className="mb-8 text-center">

          <div className="text-3xl font-bold mb-3">
            BizPilot<span className="text-blue-500"> AI</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {business
              ? "Your Business"
              : "Set up your business"}
          </h1>

          <p className="text-slate-400">
            {business
              ? "Here is your current business information."
              : "Tell us a little about your business to get started."}
          </p>

        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

          {/* Existing Business */}
          {business ? (

            <div className="space-y-6">

              {/* Success status */}
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">

                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />

                <span className="text-sm text-emerald-400">
                  Business setup completed
                </span>

              </div>

              {/* Business Name */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Business Name
                </p>

                <p className="text-xl font-semibold">
                  {business.business_name}
                </p>
              </div>

              {/* Business Type */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Business Type
                </p>

                <p className="text-base text-slate-200">
                  {business.business_type}
                </p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Description
                </p>

                <p className="text-slate-300 leading-relaxed">
                  {business.description ||
                    "No description added."}
                </p>
              </div>

              {/* Website */}
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Website
                </p>

                {business.website ? (
                  <p className="text-blue-400">
                    {business.website}
                  </p>
                ) : (
                  <p className="text-slate-500">
                    No website added.
                  </p>
                )}
              </div>

              {/* Bottom action */}
              <div className="pt-4 border-t border-slate-800">

                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold transition"
                >
                  Back to Dashboard
                </button>

              </div>

            </div>

          ) : (

            /* New Business Form */
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Name
                </label>

                <input
                  type="text"
                  value={businessName}
                  onChange={(e) =>
                    setBusinessName(e.target.value)
                  }
                  placeholder="e.g. Sifat Fashion"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Type
                </label>

                <select
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value)
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select business type
                  </option>

                  <option value="E-commerce">
                    E-commerce
                  </option>

                  <option value="Retail">
                    Retail
                  </option>

                  <option value="Food & Restaurant">
                    Food & Restaurant
                  </option>

                  <option value="Service">
                    Service
                  </option>

                  <option value="Freelancing">
                    Freelancing
                  </option>

                  <option value="Digital Agency">
                    Digital Agency
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe what your business does..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website
                  <span className="text-slate-500 ml-2">
                    (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  value={website}
                  onChange={(e) =>
                    setWebsite(e.target.value)
                  }
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 outline-none focus:border-blue-500"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed font-semibold transition"
              >
                {saving
                  ? "Creating business..."
                  : "Create Business"}
              </button>

            </form>

          )}

        </div>

        {!business && (
          <p className="text-center text-slate-500 text-sm mt-6">
            Click outside the form to return to dashboard.
          </p>
        )}

      </div>
    </main>
  );
}