import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold">
            BizPilot<span className="text-blue-500"> AI</span>
          </h1>

          <div className="hidden gap-8 md:flex">
            <a href="#features" className="text-slate-300 hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white">
              How It Works
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-white">
              Pricing
            </a>
          </div>

          <div className="flex gap-3">
             <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-slate-300 hover:text-white">     
                  Login
              </Link>

            <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium hover:bg-blue-700"
                  >
                  Get Started
              </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-blue-400">
            AI-powered business platform
          </p>

          <h2 className="text-5xl font-bold leading-tight md:text-7xl">
            Run your business
            <span className="text-blue-500"> smarter with AI.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            BizPilot AI helps small businesses manage customers, products,
            sales, marketing, automation and business decisions from one
            intelligent platform.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button className="rounded-xl bg-blue-600 px-7 py-3.5 font-semibold hover:bg-blue-700">
              Start Free
            </button>

            <button className="rounded-xl border border-slate-700 px-7 py-3.5 font-semibold hover:bg-slate-900">
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-800 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-bold">Everything your business needs</h3>

            <p className="mt-3 text-slate-400">
              One platform for managing and growing your business.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Feature
              title="AI Strategy"
              description="Get intelligent business recommendations and actionable strategies."
            />

            <Feature
              title="AI Content"
              description="Generate marketing content, campaigns and product descriptions with AI."
            />

            <Feature
              title="Automation"
              description="Automate repetitive business tasks and workflows."
            />

            <Feature
              title="Customer Support"
              description="Use AI-powered conversations to support your customers."
            />

            <Feature
              title="Sales Intelligence"
              description="Understand your sales and discover opportunities using AI."
            />

            <Feature
              title="Business Analytics"
              description="Track your business performance through useful analytics."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-900 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h3 className="text-3xl font-bold">How BizPilot AI works</h3>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step number="01" title="Create your business">
              Add your business information, products and customers.
            </Step>

            <Step number="02" title="Connect your data">
              BizPilot AI understands your business data and activity.
            </Step>

            <Step number="03" title="Grow with AI">
              Get insights, content, automation and intelligent recommendations.
            </Step>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <h3 className="text-4xl font-bold">
          Ready to build a smarter business?
        </h3>

        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Start using AI to manage, automate and grow your business.
        </p>

        <button className="mt-8 rounded-xl bg-blue-600 px-8 py-4 font-semibold hover:bg-blue-700">
          Get Started with BizPilot AI
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        © 2026 BizPilot AI. All rights reserved.
      </footer>
    </main>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
      <h4 className="text-xl font-semibold">{title}</h4>

      <p className="mt-3 leading-7 text-slate-400">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-4xl font-bold text-blue-500">{number}</div>

      <h4 className="mt-4 text-xl font-semibold">{title}</h4>

      <p className="mt-3 leading-7 text-slate-400">{children}</p>
    </div>
  );
}