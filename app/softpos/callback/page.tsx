"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { fetchApi } from "../../../lib/api";

interface StatusResponse {
  status: "pending" | "success" | "failed";
  transaction_ref: string;
  amount_kobo: number;
  amount_naira: number;
}

function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function SoftPosCallbackPage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("transaction_ref");

  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [amountKobo, setAmountKobo] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setError("No payment reference found.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    async function poll() {
      try {
        const data = await fetchApi<StatusResponse>(`/softpos/status/${reference}`);
        setAmountKobo(data.amount_kobo);

        if (data.status === "success") {
          setStatus("success");
        } else if (data.status === "failed") {
          setStatus("failed");
          setError("Payment was unsuccessful. Please try again.");
        } else if (attempts < maxAttempts) {
          // Still pending — Squad may not have sent the webhook yet, retry
          attempts++;
          setTimeout(poll, 2000);
        } else {
          // Timed out polling — Squad may be slow; show pending state
          setStatus("pending");
        }
      } catch (err: unknown) {
        setStatus("failed");
        setError(err instanceof Error ? err.message : "Could not verify payment.");
      }
    }

    poll();
  }, [reference]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-100 py-4 px-6 flex items-center justify-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#0B6E4F]" />
          <span className="font-bold text-xl text-gray-900">SquadTrust</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">

          {status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <Loader2 className="w-16 h-16 text-[#0B6E4F] animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-gray-900">Verifying Payment</h2>
              <p className="text-gray-500 text-sm">Confirming your transaction with Squad…</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-11 h-11 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful</h2>
              {amountKobo !== null && (
                <p className="text-3xl font-extrabold text-[#0B6E4F]">
                  {formatNaira(amountKobo)}
                </p>
              )}
              <p className="text-gray-500 text-sm leading-relaxed">
                Your payment has been received. The merchant will be notified automatically.
              </p>
              {reference && (
                <p className="text-xs text-gray-400 font-mono break-all">
                  Ref: {reference}
                </p>
              )}
              <p className="text-xs text-gray-400 pt-2">
                You can close this tab.
              </p>
            </motion.div>
          )}

          {status === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Payment Processing</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your payment is being processed. This may take a moment — you can close this tab and the merchant's terminal will update automatically.
              </p>
              {reference && (
                <p className="text-xs text-gray-400 font-mono break-all">
                  Ref: {reference}
                </p>
              )}
            </motion.div>
          )}

          {status === "failed" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-11 h-11 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Payment Failed</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {error || "Something went wrong. Please try again or contact the merchant."}
              </p>
              {reference && (
                <p className="text-xs text-gray-400 font-mono break-all">
                  Ref: {reference}
                </p>
              )}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
