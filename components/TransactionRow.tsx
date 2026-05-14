import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { StatusBadge, type TransactionStatus } from './StatusBadge';
import { formatNaira } from '../lib/utils';
import { ArrowRightLeft } from 'lucide-react';

export interface Transaction {
  id: string;
  reference: string;
  amountKobo: number;
  status: TransactionStatus;
  timestamp: string;
  description?: string;
}

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: (tx: Transaction) => void;
}

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const date = new Date(transaction.timestamp);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
    >
      <Link 
        href={`/pay/${transaction.reference}`}
        target="_blank"
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => onClick && onClick(transaction)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ArrowRightLeft className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px] hover:text-primary transition-colors">
              {transaction.description || transaction.reference}
            </p>
            <p className="text-xs text-gray-500">
              {date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm font-semibold text-gray-900">
            {formatNaira(transaction.amountKobo)}
          </p>
          <StatusBadge status={transaction.status} />
        </div>
      </Link>
    </motion.div>
  );
}
