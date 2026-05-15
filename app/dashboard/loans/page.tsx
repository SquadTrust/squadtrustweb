"use client";

import React, { useEffect, useState } from "react";
import { TrustScoreGauge } from "../../../components/TrustScoreGauge";
import {
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { formatNaira } from "../../../lib/utils";
import { motion, type Variants } from "framer-motion";
import confetti from "canvas-confetti";
import { useLoanEligibility, useApplyLoan } from "../../../lib/hooks/useLoan";
import { useTrustScore } from "../../../lib/hooks/useTrust";

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

const COMPONENT_LABELS: Record<string, string> = {
  fulfillment_rate: "Fulfillment Rate",
  velocity: "Transaction Volume",
  refund_rate: "Dispute Rate",
  softpos_volume: "Soft POS Volume",
  chat_sentiment: "Buyer Sentiment",
  account_age: "Account Age",
};

export default function LoansPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState(0);
  const [tenorDays, setTenorDays] = useState(30);
  const [approvedMessage, setApprovedMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const id = localStorage.getItem("merchant_id");
    if (isMounted) {
      setMerchantId(id);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const { data: eligibility, isLoading: eligLoading } =
    useLoanEligibility(merchantId);
  const { data: trustData, isLoading: trustLoading } =
    useTrustScore(merchantId);
  const applyLoan = useApplyLoan();

  const trustScore = trustData?.total_score ?? 0;
  const maxLoanNaira = eligibility?.max_amount_naira ?? 0;
  const maxLoanKobo = maxLoanNaira * 100;

  useEffect(() => {
    if (maxLoanNaira > 0 && loanAmount === 0) {
      setLoanAmount(Math.min(maxLoanNaira, 100000));
    }
  }, [maxLoanNaira, loanAmount]);

  const handleApply = async () => {
    if (!merchantId || !eligibility?.eligible || loanAmount <= 0) return;

    try {
      const result = await applyLoan.mutateAsync({
        merchantId,
        amountNaira: loanAmount,
        tenorDays,
      });

      setApprovedMessage(result.message);

      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: ReturnType<typeof setInterval> = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Application failed";
      alert(msg);
    }
  };

  if (approvedMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900">Loan Approved!</h2>
        <p className="text-lg text-gray-600 max-w-md">
          {approvedMessage}
        </p>
        <button
          onClick={() => setApprovedMessage("")}
          className="mt-8 bg-primary text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isLoading = eligLoading || trustLoading;

  return (
    <motion.div
      className="space-y-4 md:space-y-6 w-full max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Capital & Loans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Access instant credit to grow your business based on your Trust Score.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        {/* Score Details */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-sm p-6 text-white relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-6">
              Current Trust Score
            </h2>
            <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm mb-6">
              <TrustScoreGauge score={trustScore} />
            </div>
            <div className="text-center">
              <h3 className={`text-xl font-bold ${trustScore >= 700 ? "text-green-400" : trustScore >= 400 ? "text-yellow-400" : "text-red-400"}`}>
                {trustScore >= 850 ? "Excellent" : trustScore >= 700 ? "Good" : trustScore >= 500 ? "Fair" : trustScore >= 400 ? "Building" : "New Merchant"}
              </h3>
              <p className="text-gray-300 text-sm mt-2 px-2">
                {isLoading ? "Loading..." : (eligibility?.explanation ?? "Complete transactions to build your score.")}
              </p>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </motion.div>

        {/* Loan Application */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {eligibility?.eligible ? "Pre-approved Loan" : "Loan Eligibility"}
              </h2>
              <p className="text-sm text-gray-500">
                {isLoading ? "Checking eligibility..." : eligibility?.eligible
                  ? "Available based on your Score"
                  : `Score ${trustScore}/1000 — need 500+ to unlock`}
              </p>
            </div>
          </div>

          {!isLoading && !eligibility?.eligible ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-700">Not Yet Eligible</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Complete more successful escrow transactions to reach a score of 500 and unlock working capital.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Max Available</span>
                  <span className="font-semibold text-gray-900">
                    {isLoading ? "..." : formatNaira(maxLoanKobo)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: maxLoanKobo > 0 ? `${((loanAmount * 100) / maxLoanKobo) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Amount to Borrow (₦)
                  </label>
                  <input
                    type="range"
                    id="loanAmount"
                    min="10000"
                    max={maxLoanNaira || 100000}
                    step="10000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-primary"
                    disabled={isLoading || !eligibility?.eligible}
                  />
                  <div className="text-center mt-2 text-3xl font-bold text-gray-900">
                    {formatNaira(loanAmount * 100)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Repayment Period</label>
                  <div className="flex gap-2">
                    {[30, 60, 90].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setTenorDays(days)}
                        className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${tenorDays === days ? "bg-primary text-white border-primary" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    Interest rate: {eligibility?.interest_rate_monthly ?? 2.5}% per month.
                    Funds credited to your GTBank account within 5 minutes.
                  </p>
                </div>
              </div>

              <button
                onClick={handleApply}
                disabled={applyLoan.isPending || isLoading || !eligibility?.eligible || loanAmount <= 0}
                className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {applyLoan.isPending ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>Apply Now <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </>
          )}
        </motion.div>
      </div>

      {/* Trust Score Breakdown */}
      {trustData?.components && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              How your score is calculated
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Object.entries(trustData.components).map(([key, value]) => {
              const points = Number(value?.points ?? 0);
              const max = Number(value?.max ?? 0);
              const pct = Number.isFinite(points) && Number.isFinite(max) && max > 0
                ? Math.max(0, Math.min(100, Math.round((points / max) * 100)))
                : 0;
              const label = COMPONENT_LABELS[key] ?? key;
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className={`text-xs font-bold ${pct >= 70 ? "text-green-600" : pct >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                      {pct}% <span className="text-gray-400 font-normal">({Number.isFinite(points) ? Math.round(points) : 0}/{Number.isFinite(max) ? Math.round(max) : 0})</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
