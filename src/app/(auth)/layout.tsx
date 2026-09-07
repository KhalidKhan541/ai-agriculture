import { Leaf } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-12">
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AgriAI</span>
          </Link>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white lg:text-4xl">
            Grow smarter with
            <br />
            AI-powered insights
          </h2>
          <p className="mt-4 max-w-md text-green-100">
            Monitor crops, predict yields, and optimize resources with
            real-time data and machine learning.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">32%</div>
              <div className="text-sm text-green-200">Yield increase</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">40%</div>
              <div className="text-sm text-green-200">Water savings</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-green-200/60">
          &copy; {new Date().getFullYear()} AgriAI. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 sm:px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AgriAI</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
