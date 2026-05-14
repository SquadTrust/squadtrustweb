'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy, Check, Clock, PackageCheck, AlertTriangle, Lock } from 'lucide-react';
import { formatNaira } from '../../../lib/utils';

// This would normally be fetched from the backend via TanStack Query
const MOCK_ESCROW = {
  reference: '',
  merchantName: 'TechStore Gadgets',
  itemDescription: 'iPhone 13 Pro Max (Blue, 256GB)',
  amountKobo: 75000000,
  status: 'pending', // pending -> funded -> released
  virtualAccount: {
    bank: 'GTBank',
    number: '0123456789',
    name: 'SquadTrust - TechStore Gadgets',
    expiresIn: 600 // 10 minutes
  }
};

export default function BuyerPaymentPage() {
  const params = useParams();
  const ref = params.transaction_ref as string;
  
  const [escrow, setEscrow] = useState({ ...MOCK_ESCROW, reference: ref });
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(escrow.virtualAccount.expiresIn);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (escrow.status !== 'pending' || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [escrow.status, timeLeft]);

  // Demo: Poll for status changes (would use useQuery in real app)
  useEffect(() => {
    // In a real app:
    // const { data } = useQuery(['escrow', ref], () => fetchApi(`/escrow/${ref}`), { refetchInterval: 3000 });
  }, [ref]);

  const handleCopy = () => {
    navigator.clipboard.writeText(escrow.virtualAccount.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulatePayment = () => {
    setIsSimulating(true);
    // Simulate webhook arrival and status change
    setTimeout(() => {
      setEscrow(prev => ({ ...prev, status: 'funded' }));
      setIsSimulating(false);
    }, 2000);
  };

  const confirmDelivery = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setEscrow(prev => ({ ...prev, status: 'released' }));
      setIsConfirming(false);
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
          
          {/* Order Summary Header */}
          <div className="bg-gray-900 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <ShieldCheck className="w-48 h-48 -translate-y-12 translate-x-12" />
            </div>
            
            <div className="relative z-10">
              <p className="text-gray-400 text-sm font-medium mb-1">Paying</p>
              <h2 className="text-xl font-bold mb-4">{escrow.merchantName}</h2>
              <div className="text-4xl font-extrabold tracking-tight">
                {formatNaira(escrow.amountKobo)}
              </div>
              <p className="text-gray-300 text-sm mt-2">{escrow.itemDescription}</p>
            </div>
          </div>

          {/* Dynamic Content based on Status */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {escrow.status === 'pending' && (
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
                      <h3 className="font-semibold text-blue-900 text-sm">Safe-Pay Active</h3>
                      <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                        Your money is held securely in escrow. It will only be released to the seller after you confirm delivery.
                      </p>
                    </div>
                  </div>

                  {timeLeft > 0 ? (
                    <div className="border border-gray-200 rounded-xl p-5 space-y-4 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">Pay exactly</span>
                        <span className="font-bold text-gray-900">{formatNaira(escrow.amountKobo)}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Bank Name</p>
                        <p className="font-medium text-gray-900">{escrow.virtualAccount.bank}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Account Number</p>
                        <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          <span className="text-xl font-mono tracking-wider font-bold text-gray-900">
                            {escrow.virtualAccount.number}
                          </span>
                          <button 
                            onClick={handleCopy}
                            className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 py-2 rounded-lg mt-4">
                        <Clock className="w-4 h-4" />
                        Expires in {formatTime(timeLeft)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">Payment Expired</h3>
                      <p className="text-sm text-gray-500">This secure payment link has expired. Please request a new link from the seller.</p>
                    </div>
                  )}

                  {/* DEMO CONTROLS - ONLY FOR HACKATHON */}
                  <div className="pt-6 border-t border-gray-100">
                    <p className="text-xs text-center text-gray-400 mb-3 font-mono">DEMO CONTROLS</p>
                    <button
                      onClick={simulatePayment}
                      disabled={isSimulating || timeLeft <= 0}
                      className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                      {isSimulating ? 'Processing webhook...' : 'Simulate Transfer'}
                    </button>
                  </div>
                </motion.div>
              )}

              {escrow.status === 'funded' && (
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Secured</h3>
                    <p className="text-gray-600 leading-relaxed px-4">
                      Your money is safe in escrow. The seller has been notified to proceed with delivery.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-6">
                    <PackageCheck className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Have you received the item?</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Click confirm only after you&apos;ve received and inspected the item. This releases the funds.
                    </p>
                    <button
                      onClick={confirmDelivery}
                      disabled={isConfirming}
                      className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none transition-colors"
                    >
                      {isConfirming ? 'Releasing Funds...' : 'Confirm Delivery'}
                    </button>
                  </div>
                </motion.div>
              )}

              {escrow.status === 'released' && (
                <motion.div
                  key="released"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900">Transaction Complete</h3>
                  <p className="text-gray-600 px-4">
                    Funds have been released to the seller. Thank you for using SquadTrust!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Secured by Squad API
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
