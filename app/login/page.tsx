"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "../../lib/api";

interface MerchantRead {
  id: string;
  business_name: string;
  phone: string;
  email: string;
  trust_score: number;
  created_at: string;
}

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [loginPhone, setLoginPhone] = useState("");

  // Register fields
  const [regPhone, setRegPhone] = useState("");
  const [regBusiness, setRegBusiness] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regGTBank, setRegGTBank] = useState("");

  function storeAndRedirect(merchant: MerchantRead) {
    localStorage.setItem("merchant_id", merchant.id);
    localStorage.setItem("merchant_name", merchant.business_name);
    router.push("/dashboard");
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (loginPhone.length < 10) return;

    setIsLoading(true);
    try {
      const merchant = await fetchApi<MerchantRead>(
        `/merchants/by-phone/${encodeURIComponent(loginPhone)}`,
      );
      storeAndRedirect(merchant);
    } catch {
      setError(
        "No account found for this phone number. Please register first.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regBusiness || !regPhone || !regEmail) return;

    setIsLoading(true);
    try {
      const merchant = await fetchApi<MerchantRead>("/merchants", {
        method: "POST",
        body: JSON.stringify({
          business_name: regBusiness,
          phone: regPhone,
          email: regEmail,
          ...(regGTBank ? { gtbank_account: regGTBank } : {}),
        }),
      });
      storeAndRedirect(merchant);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Registration failed";
      if (msg.toLowerCase().includes("409") || msg.toLowerCase().includes("already exists")) {
        setError(
          "An account with this email or phone already exists. Please log in instead.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-center text-2xl font-extrabold text-gray-900">
            SquadTrust Merchant Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure escrow, Soft POS, and working capital — all in one place.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "register" ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md font-medium">
            {error}
          </div>
        )}

        {mode === "login" ? (
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="loginPhone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                id="loginPhone"
                type="tel"
                required
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="08012345678"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || loginPhone.length < 10}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                className="text-primary hover:underline font-medium"
              >
                Create one
              </button>
            </p>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label
                htmlFor="regBusiness"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="regBusiness"
                type="text"
                required
                value={regBusiness}
                onChange={(e) => setRegBusiness(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Aisha's Fashion Store"
              />
            </div>

            <div>
              <label
                htmlFor="regPhone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="regPhone"
                type="tel"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="08012345678"
              />
            </div>

            <div>
              <label
                htmlFor="regEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="regEmail"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="aisha@fashionstore.com"
              />
            </div>

            <div>
              <label
                htmlFor="regGTBank"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                GTBank Account Number{" "}
                <span className="text-gray-400 font-normal">(for escrow payouts)</span>
              </label>
              <input
                id="regGTBank"
                type="text"
                maxLength={10}
                value={regGTBank}
                onChange={(e) => setRegGTBank(e.target.value.replace(/\D/g, ""))}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="10-digit NUBAN"
              />
              <p className="mt-1 text-xs text-gray-400">
                Required to receive escrow fund releases. Can be added later.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !regBusiness || !regPhone || !regEmail}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </button>
            </p>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            Return to home
          </Link>
        </div>
      </div>
    </div>
  );
}
