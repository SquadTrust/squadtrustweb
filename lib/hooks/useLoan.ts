import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchApi } from "../api";

export interface LoanEligibilityResponse {
  trust_score: number;
  eligible: boolean;
  max_amount_naira: number;
  interest_rate_monthly: number;
  recommended_tenor_days: number;
  explanation: string;
}

export interface LoanApplyResponse {
  loan_id: string;
  status: string;
  amount_naira: number;
  tenor_days: number;
  message: string;
}

export interface LoanRow {
  id: string;
  merchant_id: string;
  amount_naira: number;
  tenor_days: number;
  status: "approved" | "disbursed" | "repaid" | "defaulted";
  approved_at: string | null;
  disbursed_at: string | null;
  created_at: string;
}

export function useLoanEligibility(merchantId: string | null) {
  return useQuery({
    queryKey: ["loan-eligibility", merchantId],
    queryFn: () =>
      fetchApi<LoanEligibilityResponse>("/merchants/me/loan-eligibility", {
        headers: { "X-Merchant-Id": merchantId! },
      }),
    enabled: !!merchantId,
    staleTime: 30_000,
  });
}

export function useLoanList(merchantId: string | null) {
  return useQuery({
    queryKey: ["loans", merchantId],
    queryFn: () =>
      fetchApi<LoanRow[]>("/merchants/me/loans", {
        headers: { "X-Merchant-Id": merchantId! },
      }),
    enabled: !!merchantId,
    staleTime: 30_000,
  });
}

export function useApplyLoan() {
  return useMutation({
    mutationFn: ({
      merchantId,
      amountNaira,
      tenorDays,
    }: {
      merchantId: string;
      amountNaira: number;
      tenorDays: number;
    }) =>
      fetchApi<LoanApplyResponse>("/merchants/me/apply-loan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": merchantId,
        },
        body: JSON.stringify({
          amount_naira: amountNaira,
          tenor_days: tenorDays,
        }),
      }),
  });
}
