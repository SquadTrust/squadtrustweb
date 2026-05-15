"use client";

import React, { useEffect, useState } from "react";
import { Smartphone, RefreshCw, Filter, TrendingUp } from "lucide-react";
import { TransactionRow } from "../../../components/TransactionRow";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNaira } from "../../../lib/utils";
import { motion, type Variants } from "framer-motion";
import { useSoftPosTransactions } from "../../../lib/hooks/useSoftPos";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

function buildWeeklyChart(
  transactions: Array<{ amountKobo: number; timestamp: string; status: string }>,
) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<string, number> = {};
  days.forEach((d) => (buckets[d] = 0));

  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  for (const tx of transactions) {
    if (tx.status !== "released") continue;
    const ts = new Date(tx.timestamp).getTime();
    if (ts < sevenDaysAgo) continue;
    const day = days[new Date(tx.timestamp).getDay()];
    buckets[day] += tx.amountKobo / 100;
  }

  // Rotate so today is last
  const todayIdx = new Date().getDay();
  const ordered = [];
  for (let i = 1; i <= 7; i++) {
    const dayIdx = (todayIdx + i) % 7;
    ordered.push({ name: days[dayIdx], amount: buckets[days[dayIdx]] });
  }
  return ordered;
}

export default function SoftPosPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    setMerchantId(localStorage.getItem("merchant_id"));
  }, []);

  const { data: transactions = [], isLoading, refetch } =
    useSoftPosTransactions(merchantId);

  const todayStr = new Date().toDateString();
  const todaySalesKobo = transactions
    .filter(
      (tx) =>
        tx.status === "released" &&
        new Date(tx.timestamp).toDateString() === todayStr,
    )
    .reduce((sum, tx) => sum + tx.amountKobo, 0);

  const chartData = buildWeeklyChart(transactions);

  return (
    <motion.div
      className="space-y-4 md:space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soft POS</h1>
          <p className="text-sm text-gray-500 mt-1">
            Accept contactless card payments directly on your phone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
            <Smartphone className="w-4 h-4" />
            Launch Terminal App
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col justify-between"
        >
          <div>
            <p className="text-sm font-medium text-gray-500">
              Today&apos;s Sales
            </p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">
              {isLoading ? "..." : formatNaira(todaySalesKobo)}
            </h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md font-medium">
            <TrendingUp className="w-4 h-4" />
            {transactions.filter((t) => t.status === "released").length} completed
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Weekly Volume
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  tickFormatter={(val) => `₦${val / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "#F3F4F6" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: unknown) => [
                    formatNaira(Number(value || 0) * 100),
                    "Sales",
                  ]}
                />
                <Bar dataKey="amount" fill="#0B6E4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full"
      >
        <div className="px-5 md:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Terminal Transactions
          </h2>
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No Soft POS transactions yet. Accept payments via the mobile app.
            </div>
          ) : (
            transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
