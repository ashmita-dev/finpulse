import type {
  Transaction,
  TransactionWithRisk,
} from "../types/transaction";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>("/transactions");
}

export async function getUserTransactions(
  userId: number,
): Promise<Transaction[]> {
  return request<Transaction[]>(`/users/${userId}/transactions`);
}

export async function getTransaction(
  transactionId: number,
): Promise<Transaction> {
  return request<Transaction>(`/transactions/${transactionId}`);
}

export async function createTransaction(
  transaction: Omit<Transaction, "id">,
): Promise<TransactionWithRisk> {
  return request<TransactionWithRisk>("/transactions", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}