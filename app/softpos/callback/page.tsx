"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function SoftPosCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? "";

  useEffect(() => {
    if (reference) {
      localStorage.setItem("softpos_last_reference", reference);
    }

    const timer = window.setTimeout(() => {
      router.replace("/dashboard/softpos");
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [reference, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Payment received</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {reference
              ? `Reference ${reference} has been captured. Redirecting to your Soft POS dashboard...`
              : "Redirecting to your Soft POS dashboard..."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Please wait
        </div>
      </div>
    </main>
  );
}