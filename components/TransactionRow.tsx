import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StatusBadge, type TransactionStatus } from "./StatusBadge";
import { formatNaira } from "../lib/utils";
import { ArrowRightLeft, PackageCheck, Loader2, MessageSquare } from "lucide-react";

export interface Transaction {
  id: string;
  reference: string;
  amountKobo: number;
  status: TransactionStatus;
  timestamp: string;
  description?: string;
  releasedBy?: string;
  refundReason?: string;
  aiVerdict?: string;
  aiConfidence?: number;
}

interface TransactionRowProps {
  transaction: Transaction;
  onConfirmDelivery?: (ref: string) => Promise<void>;
  onClick?: (tx: Transaction) => void;
  onOpenChat?: (tx: Transaction) => void;
}

export function TransactionRow({ transaction, onConfirmDelivery, onClick, onOpenChat }: TransactionRowProps) {
  const date = new Date(transaction.timestamp);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const isFunded = transaction.status === "funded";

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!onConfirmDelivery || confirming) return;
    setConfirming(true);
    setConfirmError("");
    try {
      await onConfirmDelivery(transaction.reference);
    } catch (err: unknown) {
      setConfirmError(err instanceof Error ? err.message : "Failed");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center justify-between p-4 gap-3">
        {/* Left: icon + description — links to buyer pay page */}
        <Link
          href={`/pay/${transaction.reference}`}
          target="_blank"
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
          onClick={() => onClick && onClick(transaction)}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ArrowRightLeft className="w-5 h-5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px] hover:text-primary transition-colors">
              {transaction.description || transaction.reference}
            </p>
            <p className="text-xs text-gray-500">
              {date.toLocaleDateString()}{" "}
              {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </Link>

        {/* Right: amount + status + optional confirm button */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <p className="text-sm font-semibold text-gray-900">
            {formatNaira(transaction.amountKobo)}
          </p>
          <StatusBadge status={transaction.status} />
          {onOpenChat && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenChat(transaction);
              }}
              className="mt-1 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md hover:bg-gray-200 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              Chat
            </button>
          )}
          {isFunded && onConfirmDelivery && (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="mt-1 flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {confirming ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <PackageCheck className="w-3 h-3" />
              )}
              {confirming ? "Releasing…" : "Confirm Delivery"}
            </button>
          )}
          {confirmError && (
            <p className="text-xs text-red-500 max-w-[140px] text-right">{confirmError}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
