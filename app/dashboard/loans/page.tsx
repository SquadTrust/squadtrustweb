"use client";

import React, { useState } from "react";
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

export default function LoansPage() {
  const trustScore = 785;
  const maxLoan = 50000000; // 500k in Kobo

  const [loanAmount, setLoanAmount] = useState(100000); // 100k Naira default display
  const [isApplying, setIsApplying] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApply = () => {
    setIsApplying(true);
    // Simulate API call
    setTimeout(() => {
      setIsApplying(false);
      setIsApproved(true);

      // Fire confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100,
      };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: ReturnType<typeof setInterval> = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          }),
        );
        confetti(
          Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          }),
        );
      }, 250);
    }, 2000);
  };

  if (isApproved) {
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
          Your loan of{" "}
          <span className="font-semibold text-gray-900">
            {formatNaira(loanAmount * 100)}
          </span>{" "}
          has been approved and instantly credited to your Squad Virtual
          Account.
        </p>
        <button
          onClick={() => setIsApproved(false)}
          className="mt-8 bg-primary text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

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
              <h3 className="text-xl font-bold text-green-400">
                Excellent Standing
              </h3>
              <p className="text-gray-300 text-sm mt-2">
                You are in the top 15% of merchants. You qualify for our lowest
                interest rates.
              </p>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </motion.div>

        {/* Loan Application Flow */}
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
                Pre-approved Loan
              </h2>
              <p className="text-sm text-gray-500">
                Available based on your Score
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Max Available</span>
              <span className="font-semibold text-gray-900">
                {formatNaira(maxLoan)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${((loanAmount * 100) / maxLoan) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label
                htmlFor="loanAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Amount to Borrow (₦)
              </label>
              <input
                type="range"
                id="loanAmount"
                min="10000"
                max={maxLoan / 100}
                step="10000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="text-center mt-2 text-3xl font-bold text-gray-900">
                {formatNaira(loanAmount * 100)}
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Interest rate: 1.5% per month. Funds will be deducted
                automatically from future Escrow/POS settlements.
              </p>
            </div>
          </div>

          <button
            onClick={handleApply}
            disabled={isApplying}
            className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isApplying ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                Apply Now <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* Trust Score Breakdown */}
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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Completed Transactions
              </span>
              <span className="text-sm font-bold text-green-600">
                High Impact
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full w-4/5"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Dispute Rate
              </span>
              <span className="text-sm font-bold text-green-600">
                Excellent
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full w-[95%]"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Account Age
              </span>
              <span className="text-sm font-bold text-yellow-600">Medium</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-yellow-500 h-1.5 rounded-full w-1/2"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
