"use client";

import React, { useEffect, useRef, useState } from "react";
import { CreateEscrowForm } from "../../../components/CreateEscrowForm";
import { TransactionRow } from "../../../components/TransactionRow";
import type { Transaction } from "../../../components/TransactionRow";
import {
  useEscrowTransactions,
  useCreateEscrow,
  useConfirmDelivery,
} from "../../../lib/hooks/useEscrow";
import { useChatHistory, useSendMessage } from "../../../lib/hooks/useChat";
import { Plus, X, Send, Mic, MicOff, MessageSquare, PackageCheck, Paperclip } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn, formatNaira } from "../../../lib/utils";

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

// ── Merchant Chat Panel ────────────────────────────────────────────────────────

function MerchantChatPanel({
  tx,
  merchantId,
  onClose,
  onConfirm,
}: {
  tx: Transaction;
  merchantId: string;
  onClose: () => void;
  onConfirm: (ref: string) => Promise<void>;
}) {
  const { data: chatData } = useChatHistory(tx.reference);
  const sendMessage = useSendMessage(tx.reference, merchantId);
  const [text, setText] = useState("");
  const [isVoice, setIsVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sendError, setSendError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const messages = chatData?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setSendError("File must be under 500 KB.");
      e.target.value = "";
      return;
    }
    setSendError("");
    setAttachmentFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function startVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSendError("Voice recording not supported in this browser.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-NG";
    recognition.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      setIsVoice(true);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    setIsVoice(false);
    recognition.start();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !attachmentPreview) return;
    setSendError("");
    try {
      await sendMessage.mutateAsync({
        sender: "merchant",
        message: trimmed,
        is_voice: isVoice,
        attachment_data: attachmentPreview ?? undefined,
        attachment_filename: attachmentFile?.name,
      });
      setText("");
      setIsVoice(false);
      setAttachmentFile(null);
      setAttachmentPreview(null);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
    }
  }

  async function handleConfirm() {
    setIsConfirming(true);
    setConfirmError("");
    try {
      await onConfirm(tx.reference);
      onClose();
    } catch (err: unknown) {
      setConfirmError(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setIsConfirming(false);
    }
  }

  // AI verdict helpers
  const verdictLabel =
    tx.aiVerdict === "approve_release"
      ? "AI Approved Release"
      : tx.aiVerdict === "reject_release"
        ? "AI Rejected"
        : "Needs Review";

  const verdictBg =
    tx.aiVerdict === "approve_release"
      ? "bg-green-50 border-green-200 text-green-800"
      : tx.aiVerdict === "reject_release"
        ? "bg-red-50 border-red-200 text-red-800"
        : "bg-yellow-50 border-yellow-200 text-yellow-800";

  const releasedByLabel =
    tx.releasedBy === "ai"
      ? "AI"
      : tx.releasedBy === "merchant"
        ? "Merchant"
        : tx.releasedBy === "buyer"
          ? "Buyer"
          : tx.releasedBy ?? "";

  const releasedByColor =
    tx.releasedBy === "ai"
      ? "text-green-700"
      : tx.releasedBy === "merchant"
        ? "text-blue-700"
        : "text-purple-700";

  const isRefunded =
    tx.status === "refunded" || (tx.status as string) === "refund_pending";

  return (
    <motion.div
      key="chat-panel"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="flex flex-col border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate text-sm">
              {tx.description || tx.reference}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatNaira(tx.amountKobo)} ·{" "}
              <span
                className={cn(
                  "font-medium",
                  tx.status === "funded" ? "text-blue-600" : "text-gray-500",
                )}
              >
                {tx.status}
              </span>
              {tx.releasedBy && (
                <span className={cn("ml-2 font-medium", releasedByColor)}>
                  · Released by: {releasedByLabel}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 transition-colors ml-3 flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* AI Verdict section */}
      {tx.aiVerdict && (
        <div className={cn("px-4 py-2.5 border-b flex items-center justify-between gap-3", verdictBg)}>
          <p className="text-xs font-semibold">{verdictLabel}</p>
          {tx.aiConfidence != null && (
            <p className="text-xs opacity-80 flex-shrink-0">
              Confidence: {Math.round(tx.aiConfidence * 100)}%
            </p>
          )}
        </div>
      )}

      {/* Refund reason callout */}
      {isRefunded && tx.refundReason && (
        <div className="px-4 py-2.5 border-b border-red-100 bg-red-50">
          <p className="text-xs font-semibold text-red-700">Refund reason</p>
          <p className="text-xs text-red-600 mt-0.5">{tx.refundReason}</p>
        </div>
      )}

      {/* Confirm delivery banner */}
      {tx.status === "funded" && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
          <PackageCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800">
              Awaiting delivery confirmation
            </p>
            {confirmError && (
              <p className="text-xs text-red-500 mt-0.5">{confirmError}</p>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-shrink-0 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {isConfirming ? "Releasing…" : "Confirm Delivery"}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-center">
              Start a conversation with your buyer to build trust and keep them
              updated on their order.
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMerchant = msg.sender === "merchant";
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[80%] ${isMerchant ? "self-end items-end" : "self-start items-start"}`}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isMerchant
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
              >
                {msg.is_voice && (
                  <span className="inline-flex items-center gap-1 text-xs opacity-75 mb-1 mr-1">
                    <Mic className="w-3 h-3" /> Voice ·{" "}
                  </span>
                )}
                {msg.message}
                {msg.has_attachment && msg.attachment_data && (
                  <div className="mt-2">
                    {msg.attachment_data.startsWith("data:image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.attachment_data}
                        alt={msg.attachment_filename ?? "attachment"}
                        className="max-h-40 rounded-lg object-contain"
                      />
                    ) : (
                      <a
                        href={msg.attachment_data}
                        download={msg.attachment_filename ?? "file"}
                        className="text-xs underline opacity-80 hover:opacity-100"
                      >
                        {msg.attachment_filename ?? "Download file"}
                      </a>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                {msg.sender === "buyer" ? "Buyer" : "You"} ·{" "}
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Attachment preview strip */}
      {attachmentPreview && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
          {attachmentPreview.startsWith("data:image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachmentPreview}
              alt="preview"
              className="h-12 w-12 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
              <Paperclip className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <p className="text-xs text-gray-600 truncate flex-1 min-w-0">
            {attachmentFile?.name ?? "File"}
          </p>
          <button
            type="button"
            onClick={() => {
              setAttachmentFile(null);
              setAttachmentPreview(null);
            }}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (isVoice) setIsVoice(false);
              }}
              placeholder={isListening ? "Listening…" : "Reply to buyer…"}
              disabled={isListening}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-12 disabled:bg-gray-50"
            />
            {isVoice && (
              <span className="absolute right-2 top-3 text-[10px] text-primary font-semibold">
                Voice
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isListening || sendMessage.isPending}
            className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={startVoice}
            disabled={isListening || sendMessage.isPending}
            className={`p-2.5 rounded-xl transition-colors ${isListening
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
          <button
            type="submit"
            disabled={(!text.trim() && !attachmentPreview) || sendMessage.isPending}
            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        {sendError && (
          <p className="text-xs text-red-500 mt-2">{sendError}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Escrow Page ───────────────────────────────────────────────────────────

export default function EscrowPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
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
    <>
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
              Create secure payment links and chat with buyers in real time.
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
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className={cn(
                      "w-full mt-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2",
                      isCopied
                        ? "bg-green-500 text-white"
                        : "bg-primary text-white hover:bg-primary/90",
                    )}
                  >
                    {isCopied ? (
                      <>
                        <svg
                          className="w-4 h-4"
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
                        Copied!
                      </>
                    ) : (
                      "Copy Link"
                    )}
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
                  onConfirmDelivery={(ref) =>
                    confirmDelivery.mutateAsync(ref).then(() => { })
                  }
                  onOpenChat={(t) => setSelectedTx(t)}
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

      {/* Chat side panel overlay */}
      <AnimatePresence>
        {selectedTx && merchantId && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 z-40 bg-gray-900/30"
            />
            <MerchantChatPanel
              key="panel"
              tx={selectedTx}
              merchantId={merchantId}
              onClose={() => setSelectedTx(null)}
              onConfirm={(ref) =>
                confirmDelivery.mutateAsync(ref).then(() => { })
              }
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
