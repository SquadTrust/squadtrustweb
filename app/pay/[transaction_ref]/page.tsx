"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Copy,
  Check,
  PackageCheck,
  AlertTriangle,
  Lock,
  Send,
  Mic,
  MicOff,
  MessageSquare,
} from "lucide-react";
import { formatNaira } from "../../../lib/utils";
import { useEscrowDetail } from "../../../lib/hooks/useEscrow";
import { useChatHistory, useSendMessage } from "../../../lib/hooks/useChat";
import { fetchApi } from "../../../lib/api";

function ChatPanel({ transactionRef }: { transactionRef: string }) {
  const { data: chatData } = useChatHistory(transactionRef);
  const sendMessage = useSendMessage(transactionRef);
  const [text, setText] = useState("");
  const [isVoice, setIsVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = chatData?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
    if (!trimmed) return;
    setSendError("");
    try {
      await sendMessage.mutateAsync({
        sender: "buyer",
        message: trimmed,
        is_voice: isVoice,
      });
      setText("");
      setIsVoice(false);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
    }
  }

  return (
    <div className="border-t border-gray-100 flex flex-col">
      <div className="px-4 py-3 bg-gray-50 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Chat with Seller
        </span>
        {messages.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Message list */}
      <div className="flex flex-col gap-2 px-4 py-3 max-h-60 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            No messages yet. Say hello to the seller!
          </p>
        )}
        {messages.map((msg) => {
          const isBuyer = msg.sender === "buyer";
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[80%] ${isBuyer ? "self-end items-end" : "self-start items-start"}`}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isBuyer
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
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 px-1">
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

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 pb-4 flex gap-2 items-end">
        <div className="flex-1 relative">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (isVoice) setIsVoice(false);
            }}
            placeholder={isListening ? "Listening…" : "Type a message…"}
            disabled={isListening}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8 disabled:bg-gray-50"
          />
          {isVoice && (
            <span className="absolute right-2 top-2.5 text-[10px] text-primary font-semibold">
              Voice
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={startVoice}
          disabled={isListening || sendMessage.isPending}
          className={`p-2 rounded-xl transition-colors ${
            isListening
              ? "bg-red-100 text-red-600 animate-pulse"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          type="submit"
          disabled={!text.trim() || sendMessage.isPending}
          className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {sendError && (
        <p className="px-4 pb-3 text-xs text-red-500">{sendError}</p>
      )}
    </div>
  );
}

export default function BuyerPaymentPage() {
  const params = useParams();
  const ref = params.transaction_ref as string;

  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data: escrow, isLoading, error } = useEscrowDetail(ref);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulatePayment = async () => {
    setIsSimulating(true);
    setActionError("");
    try {
      await fetchApi(`/demo/fund-escrow/${ref}`, { method: "POST" });
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Simulation failed",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const confirmDelivery = async () => {
    setIsConfirming(true);
    setActionError("");
    try {
      await fetchApi(`/escrow/${ref}/buyer-confirm`, { method: "POST" });
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Confirmation failed",
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-100 py-4 px-6 flex items-center justify-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl text-gray-900">SquadTrust</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {isLoading && (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Loading payment details...
            </div>
          )}

          {!isLoading && (error || !escrow) && (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Payment Not Found</h3>
              <p className="text-sm text-gray-500">
                This payment link is invalid or has expired.
              </p>
            </div>
          )}

          {!isLoading && escrow && (
            <>
              {/* Order Summary Header */}
              <div className="bg-gray-900 text-white p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                  <ShieldCheck className="w-48 h-48 -translate-y-12 translate-x-12" />
                </div>
                <div className="relative z-10">
                  <p className="text-gray-400 text-sm font-medium mb-1">Paying</p>
                  <h2 className="text-xl font-bold mb-4">
                    {escrow.merchant_business_name}
                  </h2>
                  <div className="text-4xl font-extrabold tracking-tight">
                    {formatNaira(escrow.amount_naira * 100)}
                  </div>
                  <p className="text-gray-300 text-sm mt-2">
                    {escrow.product_description}
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="px-6 pt-4">
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
                    {actionError}
                  </div>
                </div>
              )}

              {/* Dynamic Content based on Status */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {escrow.status === "pending" && (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-blue-900 text-sm">
                            Safe-Pay Active
                          </h3>
                          <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                            Your money is held securely in escrow. It will only
                            be released to the seller after you confirm delivery.
                          </p>
                        </div>
                      </div>

                      {escrow.virtual_account_number ? (
                        <div className="border border-gray-200 rounded-xl p-5 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">
                              Pay exactly
                            </span>
                            <span className="font-bold text-gray-900">
                              {formatNaira(escrow.amount_naira * 100)}
                            </span>
                          </div>

                          {escrow.bank_name && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                Bank Name
                              </p>
                              <p className="font-medium text-gray-900">
                                {escrow.bank_name}
                              </p>
                            </div>
                          )}

                          <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                              Account Number
                            </p>
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                              <span className="text-xl font-mono tracking-wider font-bold text-gray-900">
                                {escrow.virtual_account_number}
                              </span>
                              <button
                                onClick={() =>
                                  handleCopy(escrow.virtual_account_number!)
                                }
                                className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                {copied ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 text-center">
                            Account name: SquadTrust — {escrow.merchant_business_name}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 text-sm">
                          Virtual account being assigned...
                        </div>
                      )}

                      {/* Sandbox test helper */}
                      <div className="pt-6 border-t border-gray-100">
                        <p className="text-xs text-center text-gray-400 mb-3">
                          Sandbox testing — simulate a bank transfer
                        </p>
                        <button
                          onClick={simulatePayment}
                          disabled={isSimulating}
                          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                        >
                          {isSimulating
                            ? "Processing..."
                            : "Simulate Bank Transfer"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {escrow.status === "funded" && (
                    <motion.div
                      key="funded"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 space-y-6"
                    >
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Payment Secured
                        </h3>
                        <p className="text-gray-600 leading-relaxed px-4">
                          Your money is safe in escrow. The seller has been
                          notified to proceed with delivery.
                        </p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-6">
                        <PackageCheck className="w-8 h-8 text-primary mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Have you received the item?
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                          Click confirm only after you&apos;ve received and
                          inspected the item. This releases the funds.
                        </p>
                        <button
                          onClick={confirmDelivery}
                          disabled={isConfirming}
                          className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none transition-colors"
                        >
                          {isConfirming
                            ? "Releasing Funds..."
                            : "Confirm Delivery"}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {(escrow.status === "released" ||
                    escrow.status === "ai_verifying") && (
                    <motion.div
                      key="released"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8 space-y-4"
                    >
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {escrow.status === "released"
                          ? "Transaction Complete"
                          : "AI Verifying Delivery"}
                      </h3>
                      <p className="text-gray-600 px-4">
                        {escrow.status === "released"
                          ? "Funds have been released to the seller. Thank you for using SquadTrust!"
                          : "Our AI is verifying delivery. Funds will be released shortly."}
                      </p>
                    </motion.div>
                  )}

                  {(escrow.status === "refunded" ||
                    escrow.status === "expired") && (
                    <motion.div
                      key="refunded"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8 space-y-4"
                    >
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {escrow.status === "refunded"
                          ? "Payment Refunded"
                          : "Payment Expired"}
                      </h3>
                      <p className="text-gray-600 px-4">
                        {escrow.status === "refunded"
                          ? "This transaction was refunded."
                          : "This payment link has expired. Please request a new one from the seller."}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Live Chat Section */}
              <ChatPanel transactionRef={ref} />
            </>
          )}

          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Secured by Squad API · Ref:{" "}
              <span className="font-mono">{ref}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
