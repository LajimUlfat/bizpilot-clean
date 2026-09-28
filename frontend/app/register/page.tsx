"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Check password match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // Check terms
    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName,
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed. Please try again."
        );
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      // Redirect to login after successful registration
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Left Side */}
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-950 to-slate-950" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <Link href="/" className="w-fit">
              <h1 className="text-2xl font-bold tracking-tight">
                BizPilot<span className="text-blue-500"> AI</span>
              </h1>
            </Link>

            {/* Content */}
            <div className="max-w-xl">

              <div className="mb-6 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
                Start your AI-powered journey
              </div>

              <h2 className="text-5xl font-bold leading-tight xl:text-6xl">
                Build smarter.
                <br />
                <span className="text-blue-500">
                  Grow faster.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
                Create your BizPilot AI account and bring your business,
                customers, sales and automation into one intelligent platform.
              </p>

              <div className="mt-10 space-y-4">
                <Feature text="Manage your business from one place" />
                <Feature text="Generate content and strategies with AI" />
                <Feature text="Automate repetitive business workflows" />
              </div>

            </div>

            {/* Footer */}
            <p className="text-sm text-slate-600">
              © 2026 BizPilot AI. All rights reserved.
            </p>

          </div>
        </section>

        {/* Right Side */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">

          <div className="w-full max-w-md">

            {/* Mobile Logo */}
            <Link href="/" className="mb-10 block lg:hidden">
              <h1 className="text-2xl font-bold tracking-tight">
                BizPilot<span className="text-blue-500"> AI</span>
              </h1>
            </Link>

            {/* Heading */}
            <div className="mb-8">

              <p className="mb-3 text-sm font-medium text-blue-400">
                Get started
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create your account
              </h2>

              <p className="mt-3 text-slate-400">
                Start managing your business with BizPilot AI.
              </p>

            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Full name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

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
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
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

                <p className="mt-2 text-xs text-slate-600">
                  Use at least 8 characters.
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirm password
                </label>

                <div className="relative">

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-sm text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>
              </div>

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-400">

                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) =>
                    setAgreeTerms(e.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 accent-blue-600"
                />

                <span>
                  I agree to the{" "}
                  <Link
                    href="#"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>

              </label>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!agreeTerms || loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
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

            {/* Google */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3.5 font-medium text-slate-200 transition hover:bg-slate-800"
            >
              <span className="text-lg font-bold">
                G
              </span>

              Continue with Google
            </button>

            {/* Login */}
            <p className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{" "}

              <Link
                href="/login"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>

          </div>

        </section>

      </div>
    </main>
  );
}

function Feature({ text }: { text: string }) {
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
