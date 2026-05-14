import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { fetchApi } from '../api';
import type { Transaction } from "../../components/TransactionRow";

// Mocking API requests for frontend development as we focus on the UI
export function useEscrowTransactions(merchantId: string | null) {
  return useQuery({
    queryKey: ["escrow-transactions", merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      // In a real app, you would fetch from your backend:
      // return fetchApi<Transaction[]>(`/merchants/${merchantId}/escrow`);

      // Returning mock data for demonstration
      return [
        {
          id: "1",
          reference: "SBWCKYR7RP_abcd123",
          amountKobo: 5000000,
          status: "pending",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          description: "iPhone 13 Pro",
        },
        {
          id: "2",
          reference: "SBWCKYR7RP_efgh456",
          amountKobo: 2500000,
          status: "funded",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          description: "MacBook Air M1",
        },
        {
          id: "3",
          reference: "SBWCKYR7RP_ijkl789",
          amountKobo: 1200000,
          status: "released",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          description: "AirPods Pro",
        },
      ] as Transaction[];
    },
    enabled: !!merchantId,
    refetchInterval: 5000, // Poll every 5s per CLAUDE.md
  });
}

export function useCreateEscrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: {
      merchantId: string;
      customerPhone: string;
      description: string;
      amountKobo: number;
      deliveryMethod: string;
    }) => {
      // Mock successful creation
      return new Promise<{ reference: string; link: string }>((resolve) => {
        setTimeout(() => {
          const ref = `SBWCKYR7RP_${Math.random().toString(36).substring(2, 9)}`;
          resolve({
            reference: ref,
            link: `http://localhost:3000/pay/${ref}`,
          });
        }, 1000);
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["escrow-transactions", variables.merchantId],
      });
    },
  });
}
