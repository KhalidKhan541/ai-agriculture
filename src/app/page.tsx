import Link from "next/link";
import {
  Leaf,
  BarChart3,
  CloudRain,
  Sprout,
  ArrowRight,
  Shield,
  Zap,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Sprout,
    title: "Crop Monitoring",
    description:
      "Real-time tracking of crop health, growth stages, and nutrient levels across all your fields.",
  },
  {
    icon: BarChart3,
    title: "Yield Prediction",
    description:
      "AI-powered yield forecasts using satellite imagery, weather data, and historical patterns.",
  },
  {
    icon: CloudRain,
    title: "Weather Intelligence",
    description:
      "Hyperlocal weather forecasts and alerts tailored to your specific farm locations.",
  },
  {
    icon: Shield,
    title: "Pest & Disease Detection",
    description:
      "Early warning system using computer vision to identify threats before they spread.",
  },
  {
    icon: Zap,
    title: "Smart Irrigation",
    description:
      "Automated irrigation scheduling that saves water while optimizing crop health.",
  },
  {
    icon: Globe,
    title: "Multi-Farm Management",
    description:
      "Unified dashboard to manage farms, crops, and resources across multiple locations.",
  },
];

const stats = [
  { label: "Farms Managed", value: "12,000+" },
  { label: "Acres Monitored", value: "2.5M+" },
  { label: "Yield Improvement", value: "32%" },
  { label: "Water Saved", value: "40%" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AgriAI</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#stats" className="text-sm text-gray-600 hover:text-gray-900">
              Results
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-green-50/60 to-white" />
          <div className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-green-100/50 blur-3xl" />
          <div className="absolute left-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-blue-50/50 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="badge-green mb-6 inline-flex">
              <Zap className="mr-1 h-3 w-3" />
              AI-Powered Agriculture
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Grow Smarter with{" "}
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                Artificial Intelligence
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 sm:text-xl">
              Revolutionize your farming operations with AI-driven insights for
              crop monitoring, yield prediction, and precision agriculture. Make
              data-driven decisions that maximize productivity.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-green-600/25 transition-all hover:bg-green-700 hover:shadow-green-600/30"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
              >
                View Demo
              </Link>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="aspect-[16/9] bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-100">
                    <Sprout className="h-10 w-10 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Dashboard Preview — Sign up to explore
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-gray-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-green-600 sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Farm Smarter
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our platform combines satellite data, weather forecasts, and
              machine learning to deliver actionable insights for every acre.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card group hover:shadow-md transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Transform Your Farm?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Join thousands of farmers already using AgriAI to increase yields,
            reduce costs, and farm sustainably.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-green-500 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-600 px-6 py-3 text-base font-semibold text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">AgriAI</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} AgriAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
