'use client';

import React, { useState } from 'react';
import { Smartphone, RefreshCw, Filter, TrendingUp } from 'lucide-react';
import { TransactionRow, type Transaction } from '../../../components/TransactionRow';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNaira } from '../../../lib/utils';
import { motion, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Mock Soft POS transactions
const MOCK_SOFTPOS_TXNS: Transaction[] = [
  { id: '1', reference: 'SP_101', amountKobo: 1250000, status: 'released', timestamp: new Date().toISOString(), description: 'In-store Purchase' },
  { id: '2', reference: 'SP_102', amountKobo: 450000, status: 'released', timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'In-store Purchase' },
  { id: '3', reference: 'SP_103', amountKobo: 800000, status: 'refunded', timestamp: new Date(Date.now() - 7200000).toISOString(), description: 'In-store Purchase' },
  { id: '4', reference: 'SP_104', amountKobo: 2200000, status: 'released', timestamp: new Date(Date.now() - 86400000).toISOString(), description: 'In-store Purchase' },
];

const MOCK_CHART_DATA = [
  { name: 'Mon', amount: 45000 },
  { name: 'Tue', amount: 82000 },
  { name: 'Wed', amount: 60000 },
  { name: 'Thu', amount: 120000 },
  { name: 'Fri', amount: 95000 },
  { name: 'Sat', amount: 150000 },
  { name: 'Sun', amount: 130000 },
];

export default function SoftPosPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <motion.div 
      className="space-y-4 md:space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soft POS</h1>
          <p className="text-sm text-gray-500 mt-1">Accept contactless card payments directly on your phone.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="p-2 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
            <Smartphone className="w-4 h-4" />
            Launch Terminal App
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Today&apos;s Sales</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{formatNaira(1700000)}</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md font-medium">
            <TrendingUp className="w-4 h-4" />
            +12.5% vs yesterday
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Weekly Volume</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `₦${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [formatNaira(Number(value || 0) * 100), 'Sales']}
                />
                <Bar dataKey="amount" fill="#0B6E4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="px-5 md:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Terminal Transactions</h2>
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {MOCK_SOFTPOS_TXNS.map(tx => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
