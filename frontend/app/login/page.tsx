"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response from server.");
      }

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (!data.access_token) {
        throw new Error(
          "Login successful, but no access token was received."
        );
      }

      /*
       * BizPilot AI uses localStorage for authentication.
       *
       * This allows the same login session to work
       * across multiple browser tabs.
       *
       * The session remains active until logout.
       */

      localStorage.removeItem("access_token");
      sessionStorage.removeItem("access_token");

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      /*
       * Save user information for frontend use.
       */
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      /*
       * Go to dashboard in the same tab.
       */
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Left Side - Brand Section */}
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-950 to-slate-950" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <Link href="/" className="w-fit">
              <h1 className="text-2xl font-bold tracking-tight">
                BizPilot<span className="text-blue-500"> AI</span>
              </h1>
            </Link>

            {/* Main Content */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
                AI-powered business platform
              </div>

              <h2 className="text-5xl font-bold leading-tight xl:text-6xl">
                Run your business.
                <br />
                <span className="text-blue-500">
                  Grow with AI.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
                Manage your business, automate repetitive
                tasks, understand your customers, and make
                smarter decisions with BizPilot AI.
              </p>

              {/* Feature highlights */}
              <div className="mt-10 space-y-4">
                <Feature text="AI-powered business insights" />
                <Feature text="Smart marketing & automation" />
                <Feature text="Customer and sales management" />
              </div>
            </div>

            {/* Footer */}
            <p className="text-sm text-slate-600">
              © 2026 BizPilot AI. All rights reserved.
            </p>
          </div>
        </section>

        {/* Right Side - Login Form */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">

            {/* Mobile Logo */}
            <Link href="/" className="mb-12 block lg:hidden">
              <h1 className="text-2xl font-bold tracking-tight">
                BizPilot<span className="text-blue-500"> AI</span>
              </h1>
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-blue-400">
                Welcome back
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sign in to your account
              </h2>

              <p className="mt-3 text-slate-400">
                Enter your details to continue to BizPilot AI.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-sm text-slate-400 hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Keep Signed In */}
              <div className="flex items-center">
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-blue-600"
                  />

                  Keep me signed in
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-sm text-slate-600">
                or
              </span>

              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Google Login - UI only */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 font-medium text-slate-200 transition hover:bg-slate-800"
            >
              <span className="text-lg font-bold">
                G
              </span>

              Continue with Google
            </button>

            {/* Register */}
            <p className="mt-8 text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
        ✓
      </div>

      <span className="text-slate-300">
        {text}
      </span>
    </div>
  );
}