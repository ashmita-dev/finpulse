import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CreditCard,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { getUserTransactions } from "../services/api";
import { TRANSACTIONS_WS_URL } from "../config";
import type { Transaction } from "../types/transaction";

function formatCurrency(
  amount: number,
  currency: string,
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] =
    useState("INR");

  useEffect(() => {
    let mounted = true;

    async function loadTransactions() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getUserTransactions(1);

        if (!mounted) {
          return;
        }

        setTransactions(data);
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load transaction data.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTransactions();

    const socket = new WebSocket(
      TRANSACTIONS_WS_URL,
    );

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (
          message.type === "transaction.created" ||
          message.type === "risk.action.updated"
        ) {
          void loadTransactions();
        }
      } catch {
        if (mounted) {
          setError(
            "Received an invalid real-time update.",
          );
        }
      }
    };

    socket.onerror = () => {
      if (mounted) {
        setError(
          "Real-time transaction updates are unavailable.",
        );
      }
    };

    return () => {
      mounted = false;
      socket.close();
    };
  }, []);

  const completedTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) => transaction.status === "completed",
    );
  }, [transactions]);

  const currencies = useMemo(() => {
    return Array.from(
      new Set(
        completedTransactions.map(
          (transaction) => transaction.currency,
        ),
      ),
    );
  }, [completedTransactions]);

  useEffect(() => {
    if (
      currencies.length > 0 &&
      !currencies.includes(selectedCurrency)
    ) {
      setSelectedCurrency(
        currencies.includes("INR")
          ? "INR"
          : currencies[0],
      );
    }
  }, [currencies, selectedCurrency]);

  const currencyTransactions = useMemo(() => {
    return completedTransactions.filter(
      (transaction) =>
        transaction.currency === selectedCurrency,
    );
  }, [completedTransactions, selectedCurrency]);

  const total = useMemo(() => {
    return currencyTransactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0,
    );
  }, [currencyTransactions]);

  const averageTransaction = useMemo(() => {
    if (currencyTransactions.length === 0) {
      return 0;
    }

    return total / currencyTransactions.length;
  }, [total, currencyTransactions.length]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const transaction of currencyTransactions) {
      const current =
        totals.get(transaction.category) ?? 0;

      totals.set(
        transaction.category,
        current + Number(transaction.amount),
      );
    }

    return Array.from(totals.entries()).sort(
      (a, b) => b[1] - a[1],
    );
  }, [currencyTransactions]);

  const largestTransaction = useMemo(() => {
    return currencyTransactions.reduce(
      (largest, transaction) => {
        if (
          largest === null ||
          Number(transaction.amount) >
            Number(largest.amount)
        ) {
          return transaction;
        }

        return largest;
      },
      null as Transaction | null,
    );
  }, [currencyTransactions]);

  const largestCategory = categoryTotals[0];

  return (
    <>
      <div className="intro-row">
        <div>
          <h2>Analytics.</h2>

          <p>
            Understand spending patterns across completed
            transactions.
          </p>
        </div>

        <div className="date-display">
          <span>Data scope</span>

          <strong>
            {isLoading
              ? "Loading"
              : `${currencyTransactions.length} ${selectedCurrency} records`}
          </strong>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
        </div>
      )}

      <section className="metrics-grid">
        <article className="metric-card primary">
          <div className="metric-header">
            <span>Total spending</span>

            <div className="metric-header-actions">
              <select
                value={selectedCurrency}
                onChange={(event) =>
                  setSelectedCurrency(event.target.value)
                }
                aria-label="Analytics currency"
              >
                {currencies.length > 0 ? (
                  currencies.map((currency) => (
                    <option
                      key={currency}
                      value={currency}
                    >
                      {currency}
                    </option>
                  ))
                ) : (
                  <option value="INR">INR</option>
                )}
              </select>

              <Wallet
                size={19}
                strokeWidth={1.7}
              />
            </div>
          </div>

          <div className="metric-value">
            {isLoading
              ? "—"
              : formatCurrency(total, selectedCurrency)}
          </div>

          <div className="metric-footer">
            <span>
              {currencyTransactions.length} completed
              transactions
            </span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Average transaction</span>

            <TrendingUp
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {isLoading
              ? "—"
              : formatCurrency(
                  averageTransaction,
                  selectedCurrency,
                )}
          </div>

          <div className="metric-footer">
            <span>Across selected currency</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Categories</span>

            <BarChart3
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {isLoading
              ? "—"
              : categoryTotals.length}
          </div>

          <div className="metric-footer">
            <span>Distinct spending categories</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Largest transaction</span>

            <CreditCard
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {isLoading
              ? "—"
              : largestTransaction
                ? formatCurrency(
                    Number(largestTransaction.amount),
                    largestTransaction.currency,
                  )
                : formatCurrency(
                    0,
                    selectedCurrency,
                  )}
          </div>

          <div className="metric-footer">
            <span>
              {largestTransaction?.merchant ??
                "No transactions"}
            </span>
          </div>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="panel analytics-breakdown">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                Spending distribution
              </span>

              <h3>Category breakdown</h3>
            </div>

            <span className="panel-meta">
              {categoryTotals.length} categories
            </span>
          </div>

          <div className="analytics-content">
            {isLoading ? (
              <div className="empty-state">
                Loading spending data…
              </div>
            ) : categoryTotals.length === 0 ? (
              <div className="empty-state">
                No spending data available.
              </div>
            ) : (
              categoryTotals.map(
                ([category, amount]) => {
                  const percentage =
                    total === 0
                      ? 0
                      : (amount / total) * 100;

                  return (
                    <div
                      className="category-row"
                      key={category}
                    >
                      <div className="category-heading">
                        <div>
                          <strong>{category}</strong>

                          <span>
                            {percentage.toFixed(1)}%
                            of total spending
                          </span>
                        </div>

                        <strong>
                          {formatCurrency(
                            amount,
                            selectedCurrency,
                          )}
                        </strong>
                      </div>

                      <div
                        className="category-bar"
                        aria-label={`${category}: ${percentage.toFixed(
                          1,
                        )}%`}
                      >
                        <span
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>
        </article>

        <article className="panel analytics-summary">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                Spending profile
              </span>

              <h3>Key observations</h3>
            </div>
          </div>

          <div className="analytics-observations">
            <div className="observation">
              <span className="observation-label">
                Highest category
              </span>

              <strong>
                {largestCategory
                  ? largestCategory[0]
                  : "—"}
              </strong>

              <span>
                {largestCategory
                  ? formatCurrency(
                      largestCategory[1],
                      selectedCurrency,
                    )
                  : "No data available"}
              </span>
            </div>

            <div className="observation">
              <span className="observation-label">
                Largest transaction
              </span>

              <strong>
                {largestTransaction?.merchant ?? "—"}
              </strong>

              <span>
                {largestTransaction
                  ? formatCurrency(
                      Number(
                        largestTransaction.amount,
                      ),
                      largestTransaction.currency,
                    )
                  : "No data available"}
              </span>
            </div>

            <div className="observation">
              <span className="observation-label">
                Average transaction
              </span>

              <strong>
                {isLoading
                  ? "—"
                  : formatCurrency(
                      averageTransaction,
                      selectedCurrency,
                    )}
              </strong>

              <span>
                Based on completed transactions
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="panel activity-panel analytics-table-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">
              Category ranking
            </span>

            <h3>Spending by category</h3>
          </div>

          <div className="stream-status">
            <span />
            Derived from completed transaction data
          </div>
        </div>

        <div className="analytics-table">
          <div className="analytics-table-row analytics-table-heading">
            <span>Category</span>
            <span>Transactions</span>
            <span>Total</span>
            <span>Share</span>
          </div>

          {isLoading ? (
            <div className="empty-state">
              Loading analytics…
            </div>
          ) : categoryTotals.length === 0 ? (
            <div className="empty-state">
              No category data available.
            </div>
          ) : (
            categoryTotals.map(
              ([category, amount]) => {
                const transactionCount =
                  currencyTransactions.filter(
                    (transaction) =>
                      transaction.category ===
                      category,
                  ).length;

                const percentage =
                  total === 0
                    ? 0
                    : (amount / total) * 100;

                return (
                  <div
                    className="analytics-table-row"
                    key={category}
                  >
                    <strong>{category}</strong>

                    <span>{transactionCount}</span>

                    <strong>
                      {formatCurrency(
                        amount,
                        selectedCurrency,
                      )}
                    </strong>

                    <span>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              },
            )
          )}
        </div>
      </section>
    </>
  );
}

export default Analytics;
