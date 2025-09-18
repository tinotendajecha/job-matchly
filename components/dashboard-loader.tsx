import * as React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * DashboardLoader
 * A polished, animated skeleton loader for your dashboard routes.
 * - Uses shadcn/ui <Skeleton /> + Framer Motion for staggered entrance
 * - Mirrors a typical dashboard: sidebar, header, stat cards, chart, table
 * - Drop-in while data is fetching
 */
export default function DashboardLoader() {
  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      <div className="grid h-full grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="hidden md:block border-r">
          <div className="p-4">
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-5 w-28" />
            </div>

            <nav className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * i, duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 rounded-xl p-2">
                    <Skeleton className="h-4 w-4 rounded-md" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </motion.div>
              ))}
            </nav>

            <div className="mt-8 space-y-3">
              <Skeleton className="h-[110px] w-full rounded-2xl" />
              <Skeleton className="h-[110px] w-full rounded-2xl" />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-col">
          {/* Header */}
          <div className="border-b">
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex flex-1 items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-6 w-40" />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Skeleton className="h-9 w-40 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 p-4 md:p-6">
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                  className="rounded-2xl border p-4"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </div>
                  <Skeleton className="mb-2 h-8 w-20" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart & small list */}
            <div className="grid gap-4 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border p-4 lg:col-span-2"
              >
                <div className="mb-4 flex items-center justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
                {/* Fake chart bars */}
                <div className="mt-2 grid h-56 grid-cols-12 items-end gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="flex w-full flex-col justify-end">
                      <Skeleton
                        className="w-full rounded-md"
                        style={{ height: `${20 + ((i * 13) % 70)}%` }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="rounded-2xl border p-4"
              >
                <Skeleton className="mb-4 h-5 w-32" />
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-4 w-10" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="overflow-hidden rounded-2xl border"
            >
              <div className="border-b p-4">
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="divide-y">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 items-center gap-4 p-4">
                    <Skeleton className="col-span-3 h-4 w-4/5" />
                    <Skeleton className="col-span-3 h-4 w-2/3" />
                    <Skeleton className="col-span-3 h-4 w-1/2" />
                    <Skeleton className="col-span-3 h-8 w-24 rounded-xl justify-self-end" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* subtle moving light sheen over the whole layout */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
      />
    </div>
  );
}
