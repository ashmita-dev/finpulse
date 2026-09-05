import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import type { Transaction } from "../types/transaction";

interface RiskProps {
  transactions: Transaction[];
}

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function Risk({ transactions }: RiskProps) {
  const highRisk = transactions.filter(
    (transaction) => Number(transaction.amount) >= 50000,
  );

  const review = transactions.filter(
    (transaction) =>
      Number(transaction.amount) >= 10000 &&
      Number(transaction.amount) < 50000,
  );

  const approved = transactions.filter(
    (transaction) => Number(transaction.amount) < 10000,
  );

  return (
    <>
      <div className="intro-row">
        <div>
          <h2>Risk monitor.</h2>
          <p>
            Inspect transaction signals and understand why activity
            requires attention.
          </p>
        </div>
      </div>

      <section className="metrics-grid">
        <article className="metric-card">
          <div className="metric-header">
            <span>High risk</span>
            <ShieldAlert size={19} />
          </div>

          <div className="metric-value">{highRisk.length}</div>

          <div className="metric-footer warning">
            <span>Immediate attention</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Review required</span>
            <AlertTriangle size={19} />
          </div>

          <div className="metric-value">{review.length}</div>

          <div className="metric-footer warning">
            <span>Manual review signals</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Approved</span>
            <CheckCircle2 size={19} />
          </div>

          <div className="metric-value">{approved.length}</div>

          <div className="metric-footer positive">
            <span>Within normal threshold</span>
          </div>
        </article>

        <article className="metric-card primary">
          <div className="metric-header">
            <span>Risk coverage</span>
            <ShieldAlert size={19} />
          </div>

          <div className="metric-value">
            {transactions.length === 0
              ? "0%"
              : "100%"}
          </div>

          <div className="metric-footer">
            <span>Transactions evaluated</span>
          </div>
        </article>
      </section>

      <section className="panel activity-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Risk signals</span>
            <h3>Transactions requiring attention</h3>
          </div>
        </div>

        <div className="activity-table">
          <div className="table-row table-heading">
            <span>Transaction</span>
            <span>Signal</span>
            <span>Amount</span>
            <span>Decision</span>
            <span>Severity</span>
          </div>

          {[...highRisk, ...review].map((transaction) => {
            const isHighRisk =
              Number(transaction.amount) >= 50000;

            return (
              <div className="table-row" key={transaction.id}>
                <div className="transaction-cell">
                  <div className="merchant-icon">
                    {isHighRisk ? (
                      <Ban size={14} />
                    ) : (
                      <AlertTriangle size={14} />
                    )}
                  </div>

                  <div>
                    <strong>{transaction.merchant}</strong>
                    <span>
                      Transaction #{transaction.id}
                    </span>
                  </div>
                </div>

                <span>
                  {isHighRisk
                    ? "Very high amount"
                    : "High amount"}
                </span>

                <strong>
                  {formatCurrency(
                    transaction.amount,
                    transaction.currency,
                  )}
                </strong>

                <span>
                  {isHighRisk ? "BLOCK" : "REVIEW"}
                </span>

                <span
                  className={`status-pill ${
                    isHighRisk
                      ? "review"
                      : "approved"
                  }`}
                >
                  {isHighRisk ? "HIGH" : "MEDIUM"}
                </span>
              </div>
            );
          })}

          {highRisk.length === 0 && review.length === 0 && (
            <div className="empty-state">
              No transactions currently require attention.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Risk;