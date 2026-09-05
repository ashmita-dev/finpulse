import { useMemo } from "react";
import { BarChart3, TrendingUp, Wallet } from "lucide-react";

import type { Transaction } from "../types/transaction";

interface AnalyticsProps {
  transactions: Transaction[];
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function Analytics({ transactions }: AnalyticsProps) {
  const currency = transactions[0]?.currency ?? "INR";

  const total = useMemo(() => {
    return transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const transaction of transactions) {
      const current = totals.get(transaction.category) ?? 0;

      totals.set(
        transaction.category,
        current + Number(transaction.amount),
      );
    }

    return Array.from(totals.entries()).sort(
      (a, b) => b[1] - a[1],
    );
  }, [transactions]);

  const largestTransaction = useMemo(() => {
    return transactions.reduce<Transaction | null>(
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
      null,
    );
  }, [transactions]);

  return (
    <>
      <div className="intro-row">
        <div>
          <h2>Analytics.</h2>
          <p>
            Understand spending patterns across the transaction history.
          </p>
        </div>
      </div>

      <section className="metrics-grid">
        <article className="metric-card primary">
          <div className="metric-header">
            <span>Total spending</span>
            <Wallet size={19} />
          </div>

          <div className="metric-value">
            {formatCurrency(total, currency)}
          </div>

          <div className="metric-footer">
            <span>{transactions.length} transactions</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Average transaction</span>
            <TrendingUp size={19} />
          </div>

          <div className="metric-value">
            {formatCurrency(
              transactions.length === 0
                ? 0
                : total / transactions.length,
              currency,
            )}
          </div>

          <div className="metric-footer">
            <span>Across all recorded activity</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Categories</span>
            <BarChart3 size={19} />
          </div>

          <div className="metric-value">
            {categoryTotals.length}
          </div>

          <div className="metric-footer">
            <span>Distinct spending categories</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Largest transaction</span>
            <TrendingUp size={19} />
          </div>

          <div className="metric-value">
            {largestTransaction
              ? formatCurrency(
                  Number(largestTransaction.amount),
                  currency,
                )
              : "₹0.00"}
          </div>

          <div className="metric-footer">
            <span>
              {largestTransaction?.merchant ??
                "No transactions"}
            </span>
          </div>
        </article>
      </section>

      <section className="panel activity-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">
              Spending distribution
            </span>
            <h3>Category breakdown</h3>
          </div>
        </div>

        <div style={{ padding: "20px 21px 24px" }}>
          {categoryTotals.length === 0 ? (
            <div className="empty-state">
              No spending data available.
            </div>
          ) : (
            categoryTotals.map(([category, amount]) => {
              const percentage =
                total === 0 ? 0 : (amount / total) * 100;

              return (
                <div
                  key={category}
                  style={{
                    marginBottom: "22px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      color: "#53605b",
                      fontSize: "11px",
                    }}
                  >
                    <strong
                      style={{
                        color: "#17201d",
                        fontWeight: 600,
                      }}
                    >
                      {category}
                    </strong>

                    <span>
                      {formatCurrency(amount, currency)} ·{" "}
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div
                    style={{
                      height: "7px",
                      borderRadius: "8px",
                      background: "#eef1ee",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: "100%",
                        borderRadius: "inherit",
                        background: "#2ad5a4",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}

export default Analytics;