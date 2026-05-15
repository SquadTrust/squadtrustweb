"use client";

import React, { useEffect, useState } from "react";
import { CreateEscrowForm } from "../../../components/CreateEscrowForm";
import { TransactionRow } from "../../../components/TransactionRow";
import {
  useEscrowTransactions,
  useCreateEscrow,
  useConfirmDelivery,
} from "../../../lib/hooks/useEscrow";
import { Plus, X } from "lucide-react";
import { motion, type Variants } from "framer-motion";

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

export default function EscrowPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMerchantId(localStorage.getItem("merchant_id"));
  }, []);

  const { data: transactions = [], isLoading } =
    useEscrowTransactions(merchantId);
  const createEscrow = useCreateEscrow();
  const confirmDelivery = useConfirmDelivery(merchantId);

  const handleCreateSubmit = async (data: {
    customerPhone: string;
    description: string;
    amountKobo: number;
    deliveryMethod: string;
  }) => {
    if (!merchantId) return;

    try {
      const response = await createEscrow.mutateAsync({
        ...data,
        merchantId,
      });
      setCreatedLink(response.link);
    } catch (error) {
      console.error("Failed to create escrow:", error);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">
            Escrow Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create secure payment links and track funds.
          </p>
        </div>
        <button
          onClick={() => {
            setIsFormOpen(true);
            setCreatedLink(null);
          }}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Escrow
        </button>
      </motion.div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            {createdLink ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Escrow Created!
                </h3>
                <p className="text-sm text-gray-600">
                  Share this link with your buyer:
                </p>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 break-all text-sm font-mono text-gray-800">
                  {createdLink}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdLink);
                    // Could add a toast here
                  }}
                  className="w-full mt-4 bg-primary text-white py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="w-full mt-2 bg-white text-gray-700 py-2 rounded-md font-medium text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-2">
                <CreateEscrowForm
                  onSubmit={handleCreateSubmit}
                  isLoading={createEscrow.isPending}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full"
      >
        <div className="px-5 md:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            All Transactions
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Loading transactions...
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onConfirmDelivery={(ref) => confirmDelivery.mutateAsync(ref).then(() => {})}
              />
            ))
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
