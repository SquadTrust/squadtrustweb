import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../api";
import type { Transaction } from "../../components/TransactionRow";

interface EscrowItem {
  id: string;
  transaction_ref: string;
  amount_kobo: number;
  amount_naira?: number;
  status: string;
  product_description?: string;
  delivery_method?: string;
  created_at: string;
  released_at?: string | null;
}

interface EscrowListResponse {
  items: EscrowItem[];
  total: number;
  page: number;
  per_page: number;
}

interface CreateEscrowResponse {
  transaction_ref: string;
  virtual_account_number?: string;
  payment_url: string;
  amount_kobo: number;
  amount_naira: number;
  expires_at?: string;
}

export interface EscrowPublicView {
  transaction_ref: string;
  merchant_business_name: string;
  amount_naira: number;
  product_description?: string;
  virtual_account_number?: string | null;
  bank_name?: string | null;
  status: string;
  created_at: string;
}

export function useEscrowTransactions(merchantId: string | null) {
  return useQuery({
    queryKey: ["escrow-transactions", merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const resp = await fetchApi<EscrowListResponse>("/escrow?page=1&per_page=50", {
        headers: { "X-Merchant-Id": merchantId },
      });
      return resp.items.map((item): Transaction => ({
        id: item.id,
        reference: item.transaction_ref,
        amountKobo: item.amount_kobo,
        status: item.status as Transaction["status"],
        timestamp: item.created_at,
        description: item.product_description,
      }));
    },
    enabled: !!merchantId,
    refetchInterval: 5000,
  });
}

export function useCreateEscrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      merchantId: string;
      customerPhone: string;
      description: string;
      amountKobo: number;
      deliveryMethod: string;
    }) => {
      const resp = await fetchApi<CreateEscrowResponse>("/escrow/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": data.merchantId,
        },
        body: JSON.stringify({
          customer_phone: data.customerPhone,
          customer_name: "Buyer",
          amount_naira: data.amountKobo / 100,
          product_description: data.description,
          delivery_method: data.deliveryMethod,
        }),
      });
      return {
        reference: resp.transaction_ref,
        link: resp.payment_url,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["escrow-transactions", variables.merchantId],
      });
    },
  });
}

export function useConfirmDelivery(merchantId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionRef: string) => {
      if (!merchantId) throw new Error("Not authenticated");
      return fetchApi(`/escrow/${transactionRef}/confirm-delivery`, {
        method: "POST",
        headers: { "X-Merchant-Id": merchantId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escrow-transactions", merchantId] });
    },
  });
}

export function useEscrowDetail(transactionRef: string | null) {
  return useQuery({
    queryKey: ["escrow-detail", transactionRef],
    queryFn: () => fetchApi<EscrowPublicView>(`/escrow/${transactionRef}`),
    enabled: !!transactionRef,
    refetchInterval: 3000,
  });
}
