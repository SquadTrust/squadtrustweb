import Link from 'next/link';
import { ShieldCheck, Smartphone, TrendingUp, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 sm:px-12 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <span className="font-bold text-xl tracking-tight text-gray-900">SquadTrust</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Log in
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 sm:py-32 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Lock className="w-4 h-4" />
            <span>Secure Escrow & Payments</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
            Trust every <span className="text-primary">transaction.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Protect your buyers and grow your business with zero-risk escrow payments, 
            instant soft POS, and credit scoring. Powered by Squad.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/login" 
              className="w-full sm:w-auto text-base font-semibold bg-primary text-white px-8 py-3.5 rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              Start Selling Safely
            </Link>
            <Link 
              href="#features" 
              className="w-full sm:w-auto text-base font-semibold bg-white text-gray-900 px-8 py-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 sm:px-12 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-start text-left space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Safe-Pay Escrow</h3>
            <p className="text-gray-600 leading-relaxed">
              Buyers pay into a secure Squad virtual account. Funds are only released when they confirm delivery.
            </p>
          </div>
          <div className="flex flex-col items-start text-left space-y-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Soft POS</h3>
            <p className="text-gray-600 leading-relaxed">
              Turn your smartphone into a payment terminal. Accept contactless payments anywhere, instantly.
            </p>
          </div>
          <div className="flex flex-col items-start text-left space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Trust Score & Loans</h3>
            <p className="text-gray-600 leading-relaxed">
              Build your Trust Score with every successful transaction to unlock instant, low-interest micro-loans.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
