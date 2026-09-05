import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import { getUserRiskTransactions } from "../services/api";
import type { TransactionWithRisk } from "../types/transaction";

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function Risk() {
  const [transactions, setTransactions] = useState<
    TransactionWithRisk[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRiskData() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getUserRiskTransactions(1);

        setTransactions(data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load risk data.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRiskData();
  }, []);

  const highRisk = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.risk.risk_level === "HIGH",
      ),
    [transactions],
  );

  const review = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.risk.risk_level === "MEDIUM",
      ),
    [transactions],
  );

  const approved = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.risk.risk_level === "LOW",
      ),
    [transactions],
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

      {error && (
        <div className="error-banner">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="metrics-grid">
        <article className="metric-card">
          <div className="metric-header">
            <span>High risk</span>
            <ShieldAlert size={19} />
          </div>

          <div className="metric-value">
            {isLoading ? "—" : highRisk.length}
          </div>

          <div className="metric-footer warning">
            <span>Immediate attention</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Review required</span>
            <AlertTriangle size={19} />
          </div>

          <div className="metric-value">
            {isLoading ? "—" : review.length}
          </div>

          <div className="metric-footer warning">
            <span>Manual review signals</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Approved</span>
            <CheckCircle2 size={19} />
          </div>

          <div className="metric-value">
            {isLoading ? "—" : approved.length}
          </div>

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
            {isLoading
              ? "—"
              : transactions.length === 0
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
            <span className="panel-kicker">
              Risk engine
            </span>
            <h3>Transaction risk assessments</h3>
          </div>

          <div className="stream-status">
            <span />
            Python risk engine
          </div>
        </div>

        <div className="activity-table">
          <div className="table-row table-heading">
            <span>Transaction</span>
            <span>Risk score</span>
            <span>Decision</span>
            <span>Level</span>
            <span>Signals</span>
          </div>

          {isLoading ? (
            <div className="empty-state">
              Evaluating transactions…
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              No transactions available for risk analysis.
            </div>
          ) : (
            transactions.map((transaction) => {
              const level =
                transaction.risk.risk_level;

              const isHigh = level === "HIGH";
              const isMedium = level === "MEDIUM";

              return (
                <div
                  className="table-row"
                  key={transaction.id}
                >
                  <div className="transaction-cell">
                    <div className="merchant-icon">
                      {isHigh ? (
                        <Ban size={14} />
                      ) : isMedium ? (
                        <AlertTriangle size={14} />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                    </div>

                    <div>
                      <strong>
                        {transaction.merchant}
                      </strong>

                      <span>
                        {formatCurrency(
                          transaction.amount,
                          transaction.currency,
                        )}
                      </span>
                    </div>
                  </div>

                  <strong>
                    {transaction.risk.risk_score}
                  </strong>

                  <span>
                    {transaction.risk.decision}
                  </span>

                  <span
                    className={`status-pill ${
                      isHigh || isMedium
                        ? "review"
                        : "approved"
                    }`}
                  >
                    {level}
                  </span>

                  <span>
                    {transaction.risk.reasons.length}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {transactions.length > 0 && (
        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                Explainability
              </span>

              <h3>Risk signals</h3>
            </div>
          </div>

          <div style={{ padding: "20px 21px 24px" }}>
            {transactions
              .filter(
                (transaction) =>
                  transaction.risk.reasons.length > 0,
              )
              .slice(0, 6)
              .map((transaction) => (
                <div
                  key={transaction.id}
                  style={{
                    padding: "16px 0",
                    borderTop:
                      "1px solid #eef0ee",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: "20px",
                      marginBottom: "9px",
                    }}
                  >
                    <strong
                      style={{
                        color: "#17201d",
                        fontSize: "12px",
                      }}
                    >
                      {transaction.merchant}
                    </strong>

                    <span
                      className={`status-pill ${
                        transaction.risk.risk_level ===
                        "HIGH"
                          ? "review"
                          : "approved"
                      }`}
                    >
                      Score{" "}
                      {transaction.risk.risk_score}
                    </span>
                  </div>

                  {transaction.risk.reasons.map(
                    (reason) => (
                      <div
                        key={reason}
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "6px",
                          color: "#6e7974",
                          fontSize: "10px",
                        }}
                      >
                        <ShieldAlert
                          size={13}
                        />
                        <span>{reason}</span>
                      </div>
                    ),
                  )}
                </div>
              ))}
          </div>
        </section>
      )}
    </>
  );
}

export default Risk;