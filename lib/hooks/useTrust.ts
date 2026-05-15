import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../api";

export interface TrustScoreComponents {
  fulfillment_rate?: number;
  transaction_velocity?: number;
  refund_rate?: number;
  softpos_volume?: number;
  chat_sentiment?: number;
  account_age?: number;
  [key: string]: number | undefined;
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
