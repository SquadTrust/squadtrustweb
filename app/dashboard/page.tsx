"use client";

import React, { useEffect, useState } from "react";
import { TrustScoreGauge } from "../../components/TrustScoreGauge";
import { TransactionRow } from "../../components/TransactionRow";
import { useEscrowTransactions } from "../../lib/hooks/useEscrow";
import { ShieldAlert, Wallet } from "lucide-react";
import Link from "next/link";
import { formatNaira } from "../../lib/utils";
import { motion, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function DashboardOverview() {
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMerchantId(localStorage.getItem("merchant_id"));
  }, []);

  const { data: transactions = [], isLoading } =
    useEscrowTransactions(merchantId);

  const trustScore = 785; // This would typically come from an API
  const totalEscrow = transactions.reduce(
    (acc, tx) => acc + (tx.status === "funded" ? tx.amountKobo : 0),
    0,
  );

  return (
    <motion.div
      className="space-y-4 md:space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your Trust Score and recent activity.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
        {/* Trust Score Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col items-center justify-center"
        >
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Your Trust Score
          </h2>
          <TrustScoreGauge score={trustScore} />
          <p className="text-center text-xs text-gray-500 mt-4">
            Excellent. You qualify for instant loans up to ₦500,000.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">In Escrow</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatNaira(totalEscrow)}
                </h3>
              </div>
            </div>
            <Link
              href="/dashboard/escrow"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View Escrow Transactions &rarr;
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Available to Withdraw
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatNaira(15000000)}
                </h3>
              </div>
            </div>
            <button className="text-left text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Withdraw Funds &rarr;
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-sm p-5 md:p-6 text-white sm:col-span-2 flex items-center justify-between transition-all"
          >
            <div>
              <h3 className="text-lg font-bold">Grow your business</h3>
              <p className="text-primary-foreground/80 text-sm mt-1 max-w-sm">
                With a Trust Score of {trustScore}, you&apos;re pre-approved for
                low-interest credit.
              </p>
            </div>
            <Link
              href="/dashboard/loans"
              className="bg-white text-primary px-4 py-2 rounded-md text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
            >
              Apply Now
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full"
      >
        <div className="px-5 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>
          <Link
            href="/dashboard/escrow"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Loading transactions...
            </div>
          ) : transactions.length > 0 ? (
            transactions
              .slice(0, 5)
              .map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              No transactions found.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
