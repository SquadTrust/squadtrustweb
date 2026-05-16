"use client";

import React, { useEffect, useState } from "react";
import { TrustScoreGauge } from "../../../components/TrustScoreGauge";
import {
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Clock,
  CalendarDays,
  Banknote,
} from "lucide-react";
import { formatNaira } from "../../../lib/utils";
import { motion, type Variants } from "framer-motion";
import confetti from "canvas-confetti";
import {
  useLoanEligibility,
  useApplyLoan,
  useLoanList,
  type LoanRow,
} from "../../../lib/hooks/useLoan";
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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  approved: { bg: "bg-blue-100", text: "text-blue-700", label: "Approved" },
  disbursed: { bg: "bg-green-100", text: "text-green-700", label: "Disbursed" },
  repaid: { bg: "bg-gray-100", text: "text-gray-600", label: "Repaid" },
  defaulted: { bg: "bg-red-100", text: "text-red-700", label: "Defaulted" },
};

function repaymentAmount(principal: number, tenorDays: number, monthlyRate: number): number {
  const months = tenorDays / 30;
  return Math.round(principal * (1 + (monthlyRate / 100) * months));
}

function daysLeft(approvedAt: string, tenorDays: number): number {
  const due = new Date(approvedAt).getTime() + tenorDays * 86_400_000;
  return Math.max(0, Math.ceil((due - Date.now()) / 86_400_000));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ActiveLoanCard({
  loan,
  interestRate,
}: {
  loan: LoanRow;
  interestRate: number;
}) {
  const repay = repaymentAmount(loan.amount_naira, loan.tenor_days, interestRate);
  const interest = repay - loan.amount_naira;
  const remaining = loan.approved_at ? daysLeft(loan.approved_at, loan.tenor_days) : null;
  const dueDate = loan.approved_at
    ? formatDate(
        new Date(
          new Date(loan.approved_at).getTime() + loan.tenor_days * 86_400_000
        ).toISOString()
      )
    : "—";
  const style = STATUS_STYLES[loan.status] ?? STATUS_STYLES.approved;

  return (
    <motion.div
      variants={itemVariants}
      className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Banknote className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Active Loan</h2>
            <p className="text-sm text-gray-500">Outstanding working capital</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>

      {/* Amount */}
      <div className="bg-gray-900 rounded-xl p-6 text-white text-center">
        <p className="text-sm text-gray-400 mb-1">Amount Borrowed</p>
        <p className="text-4xl font-extrabold">{formatNaira(loan.amount_naira * 100)}</p>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Approved
          </div>
          <p className="font-semibold text-gray-900 text-sm">
            {loan.approved_at ? formatDate(loan.approved_at) : "—"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <CalendarDays className="w-3.5 h-3.5" />
            Due Date
          </div>
          <p className="font-semibold text-gray-900 text-sm">{dueDate}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            Days Remaining
          </div>
          <p className={`font-semibold text-sm ${remaining === 0 ? "text-red-600" : "text-gray-900"}`}>
            {remaining === null ? "—" : remaining === 0 ? "Overdue" : `${remaining} days`}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Tenor
          </div>
          <p className="font-semibold text-gray-900 text-sm">{loan.tenor_days} days</p>
        </div>
      </div>

      {/* Repayment breakdown */}
      <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-gray-500">Principal</span>
          <span className="font-semibold text-gray-900">{formatNaira(loan.amount_naira * 100)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-gray-500">
            Interest ({interestRate}% × {loan.tenor_days / 30}mo)
          </span>
          <span className="font-semibold text-gray-900">{formatNaira(interest * 100)}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm bg-gray-50 rounded-b-lg">
          <span className="font-bold text-gray-900">Total Repayment</span>
          <span className="font-extrabold text-primary">{formatNaira(repay * 100)}</span>
        </div>
      </div>

      {/* Block notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
        <p>You cannot apply for a new loan until this one is fully repaid.</p>
      </div>
    </motion.div>
  );
}

export default function LoansPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState(0);
  const [tenorDays, setTenorDays] = useState(30);
  const [approvedMessage, setApprovedMessage] = useState("");
  const [activeLoan, setActiveLoan] = useState<LoanRow | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("merchant_id");
    setMerchantId(id);
  }, []);

  const { data: eligibility, isLoading: eligLoading } = useLoanEligibility(merchantId);
  const { data: trustData, isLoading: trustLoading } = useTrustScore(merchantId);
  const { data: loansData } = useLoanList(merchantId);
  const applyLoan = useApplyLoan();

  // Sync active loan from backend list
  useEffect(() => {
    if (!loansData) return;
    const found = loansData.find(
      (l) => l.status === "approved" || l.status === "disbursed"
    ) ?? null;
    setActiveLoan(found);
  }, [loansData]);

  const trustScore = trustData?.total_score ?? 0;
  const maxLoanNaira = eligibility?.max_amount_naira ?? 0;
  const maxLoanKobo = maxLoanNaira * 100;

  useEffect(() => {
    if (maxLoanNaira > 0 && loanAmount === 0) {
      setLoanAmount(Math.min(maxLoanNaira, 100_000));
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

      // Populate active loan from response so "View Details" shows immediately
      const now = new Date().toISOString();
      setActiveLoan({
        id: result.loan_id,
        merchant_id: merchantId,
        amount_naira: result.amount_naira,
        tenor_days: result.tenor_days,
        status: result.status as LoanRow["status"],
        approved_at: now,
        disbursed_at: null,
        created_at: now,
      });

      setApprovedMessage(result.message);

      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval = setInterval(() => {
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

  // Success screen
  if (approvedMessage && !showDetails) {
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
        <p className="text-lg text-gray-600 max-w-md">{approvedMessage}</p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={() => setShowDetails(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            View Loan Details
          </button>
          <button
            onClick={() => { setApprovedMessage(""); setShowDetails(false); }}
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isLoading = eligLoading || trustLoading;
  const displayActiveLoan = activeLoan || (showDetails ? activeLoan : null);

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
        {/* Trust score panel — always shown */}
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

        {/* Right panel: active loan OR application form */}
        {displayActiveLoan ? (
          <ActiveLoanCard
            loan={displayActiveLoan}
            interestRate={eligibility?.interest_rate_monthly ?? 2.5}
          />
        ) : (
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

                  {loanAmount > 0 && (
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 text-sm">
                      <div className="flex justify-between px-4 py-2.5">
                        <span className="text-gray-500">Principal</span>
                        <span className="font-semibold">{formatNaira(loanAmount * 100)}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2.5">
                        <span className="text-gray-500">
                          Interest ({eligibility?.interest_rate_monthly ?? 2.5}% × {tenorDays / 30}mo)
                        </span>
                        <span className="font-semibold">
                          {formatNaira(
                            (repaymentAmount(loanAmount, tenorDays, eligibility?.interest_rate_monthly ?? 2.5) - loanAmount) * 100
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between px-4 py-2.5 bg-gray-50 rounded-b-lg">
                        <span className="font-bold text-gray-900">Total Repayment</span>
                        <span className="font-extrabold text-primary">
                          {formatNaira(repaymentAmount(loanAmount, tenorDays, eligibility?.interest_rate_monthly ?? 2.5) * 100)}
                        </span>
                      </div>
                    </div>
                  )}

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
        )}
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
