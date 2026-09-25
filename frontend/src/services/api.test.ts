import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  createTransaction,
  getTransactions,
} from "./api";

describe("FinPulse API service", () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = jest.fn<typeof fetch>();
    globalThis.fetch = mockFetch;
  });

  it("fetches transactions successfully", async () => {
    const transactions = [
      {
        id: 1,
        user_id: 1,
        amount: "1000.00",
        currency: "INR",
        merchant: "Test Merchant",
        category: "Shopping",
        timestamp: "2026-09-25T10:00:00+05:30",
        location: "Kolkata",
        device_id: "device_001",
        status: "completed",
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => transactions,
    } as Response);

    const result = await getTransactions();

    expect(result).toEqual(transactions);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/transactions",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("creates a transaction successfully", async () => {
    const transaction = {
      id: 66,
      user_id: 1,
      amount: "1500000.00",
      currency: "INR",
      merchant: "Test Merchant",
      category: "Shopping",
      timestamp: "2026-09-25T10:00:00+05:30",
      location: "Kolkata",
      device_id: "device_test",
      status: "pending",
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => transaction,
    } as Response);

    const result = await createTransaction({
      user_id: 1,
      amount: "1500000.00",
      currency: "INR",
      merchant: "Test Merchant",
      category: "Shopping",
      timestamp: "2026-09-25T10:00:00+05:30",
      location: "Kolkata",
      device_id: "device_test",
      status: "pending",
    });

    expect(result).toEqual(transaction);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/transactions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          user_id: 1,
          amount: "1500000.00",
          currency: "INR",
          merchant: "Test Merchant",
          category: "Shopping",
          timestamp: "2026-09-25T10:00:00+05:30",
          location: "Kolkata",
          device_id: "device_test",
          status: "pending",
        }),
      }),
    );
  });
});