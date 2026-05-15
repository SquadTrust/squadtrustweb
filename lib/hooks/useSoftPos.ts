import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../api";
import type { Transaction } from "../../components/TransactionRow";

interface SoftPosItem {
  id: string;
  transaction_ref: string;
  amount_kobo: number;
  amount_naira?: number;
  status: string;
  created_at: string;
}

interface SoftPosListResponse {
  items: SoftPosItem[];
  total: number;
  page: number;
  per_page: number;
}

export function useSoftPosTransactions(merchantId: string | null) {
  return useQuery({
    queryKey: ["softpos-transactions", merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const resp = await fetchApi<SoftPosListResponse>(
        "/softpos?page=1&per_page=50",
        { headers: { "X-Merchant-Id": merchantId } },
      );
      return resp.items.map((item): Transaction => ({
        id: item.id,
        reference: item.transaction_ref,
        amountKobo: item.amount_kobo,
        status:
          item.status === "success"
            ? "released"
            : item.status === "failed"
              ? "refunded"
              : "pending",
        timestamp: item.created_at,
        description: "In-store Purchase",
      }));
    },
    enabled: !!merchantId,
    refetchInterval: 5000,
  });
}
