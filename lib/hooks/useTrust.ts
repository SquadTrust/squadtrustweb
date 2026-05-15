import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../api";

export interface TrustScoreComponentBreakdown {
  points: number;
  max: number;
  [key: string]: number;
}

export interface TrustScoreComponents {
  fulfillment_rate?: TrustScoreComponentBreakdown;
  velocity?: TrustScoreComponentBreakdown;
  refund_rate?: TrustScoreComponentBreakdown;
  softpos_volume?: TrustScoreComponentBreakdown;
  chat_sentiment?: TrustScoreComponentBreakdown;
  account_age?: TrustScoreComponentBreakdown;
  [key: string]: TrustScoreComponentBreakdown | undefined;
}

export interface TrustScoreResponse {
  merchant_id: string;
  total_score: number;
  rank: string;
  loan_eligibility_naira: number;
  components: TrustScoreComponents;
  explanation: string;
  computed_at: string;
}

export function useTrustScore(merchantId: string | null) {
  return useQuery({
    queryKey: ["trust-score", merchantId],
    queryFn: () =>
      fetchApi<TrustScoreResponse>(`/merchants/${merchantId}/trust-score`),
    enabled: !!merchantId,
    staleTime: 30_000,
  });
}
