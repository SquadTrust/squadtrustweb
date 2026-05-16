import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../api";

export interface ChatMessage {
  id: string;
  sender: "buyer" | "merchant" | "system";
  message: string;
  is_voice: boolean;
  sentiment_score: number | null;
  created_at: string;
  is_encrypted: boolean;
  has_attachment: boolean;
  attachment_filename?: string | null;
  attachment_data?: string | null;
}

interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
}

interface SendMessagePayload {
  sender: "buyer" | "merchant";
  message: string;
  is_voice?: boolean;
  attachment_data?: string;
  attachment_filename?: string;
}

export function useChatHistory(transactionRef: string | null) {
  return useQuery({
    queryKey: ["chat", transactionRef],
    queryFn: () =>
      fetchApi<ChatHistoryResponse>(`/escrow/${transactionRef}/chat`),
    enabled: !!transactionRef,
    refetchInterval: 3000,
  });
}

export function useSendMessage(
  transactionRef: string,
  merchantId?: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (merchantId) {
        headers["X-Merchant-Id"] = merchantId;
      }
      return fetchApi<ChatMessage>(`/escrow/${transactionRef}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", transactionRef] });
    },
  });
}
