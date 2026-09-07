import { useMemo } from "react";
import {
  BarChart3,
  CreditCard,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useAppSelector } from "../app/hooks";

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
  const {
    items: transactions,
    isLoading,
    error,
  } = useAppSelector((state) => state.transactions);

  const currency = transactions[0]?.currency ?? "INR";

  const total = useMemo(() => {
    return transactions.reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount),
      0,
    );
  }, [transactions]);

  const averageTransaction = useMemo(() => {
    if (transactions.length === 0) {
      return 0;
    }

    return total / transactions.length;
  }, [total, transactions.length]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();

    for (const transaction of transactions) {
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
  }, [transactions]);

  const largestTransaction = useMemo(() => {
    return transactions.reduce(
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
      null as (typeof transactions)[number] | null,
    );
  }, [transactions]);

  const largestCategory = categoryTotals[0];

  return (
    <>
      <div className="intro-row">
        <div>
          <h2>Analytics.</h2>

          <p>
            Understand spending patterns across the
            transaction history.
          </p>
        </div>

        <div className="date-display">
          <span>Data scope</span>

          <strong>
            {isLoading
              ? "Loading"
              : `${transactions.length} records`}
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

            <Wallet
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {isLoading
              ? "—"
              : formatCurrency(total, currency)}
          </div>

          <div className="metric-footer">
            <span>
              {transactions.length} transactions
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
                  currency,
                )}
          </div>

          <div className="metric-footer">
            <span>Across recorded activity</span>
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
                    Number(
                      largestTransaction.amount,
                    ),
                    largestTransaction.currency,
                  )
                : formatCurrency(0, currency)}
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
                          <strong>
                            {category}
                          </strong>

                          <span>
                            {percentage.toFixed(1)}%
                            of total spending
                          </span>
                        </div>

                        <strong>
                          {formatCurrency(
                            amount,
                            currency,
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
                      currency,
                    )
                  : "No data available"}
              </span>
            </div>

            <div className="observation">
              <span className="observation-label">
                Largest transaction
              </span>

              <strong>
                {largestTransaction?.merchant ??
                  "—"}
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
                      currency,
                    )}
              </strong>

              <span>
                Based on recorded activity
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
            Derived from transaction data
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
                  transactions.filter(
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

                    <span>
                      {transactionCount}
                    </span>

                    <strong>
                      {formatCurrency(
                        amount,
                        currency,
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