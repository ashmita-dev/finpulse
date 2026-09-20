import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import { getUserRiskTransactions } from "../services/api";
import type { TransactionWithRisk } from "../types/transaction";

function formatCurrency(
  amount: string,
  currency: string,
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function Risk() {
  const [transactions, setTransactions] = useState<
    TransactionWithRisk[]
  >([]);

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithRisk | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadRiskData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getUserRiskTransactions(1);

      setTransactions(data);

      if (data.length > 0) {
        setSelectedTransaction(data[0]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load risk data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRiskData();
  }, [loadRiskData]);

  useEffect(() => {
    const socket = new WebSocket(
      "ws://127.0.0.1:8000/ws/transactions",
    );

    socket.onopen = () => {
      console.log("✅ Risk Monitor WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        console.log(
          "📩 Risk Monitor WebSocket message received:",
          message,
        );

        if (message.type === "transaction.created") {
          void loadRiskData();
        }
      } catch {
        console.error(
          "❌ Invalid Risk Monitor WebSocket message:",
          event.data,
        );
      }
    };

    socket.onerror = (socketError) => {
      console.error(
        "❌ Risk Monitor WebSocket error:",
        socketError,
      );
    };

    socket.onclose = (event) => {
      console.log(
        "🔌 Risk Monitor WebSocket disconnected:",
        event.code,
        event.reason,
      );
    };

    return () => {
      socket.close();
    };
  }, [loadRiskData]);

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

  const averageRiskScore = useMemo(() => {
    if (transactions.length === 0) {
      return 0;
    }

    const total = transactions.reduce(
      (sum, transaction) =>
        sum + transaction.risk.risk_score,
      0,
    );

    return Math.round(total / transactions.length);
  }, [transactions]);

  return (
    <>
      <div className="intro-row">
        <div>
          <h2>Risk monitor.</h2>

          <p>
            Inspect transaction signals and understand why
            activity requires attention.
          </p>
        </div>

        <div className="date-display">
          <span>Engine status</span>

          <strong>
            {isLoading ? "Evaluating" : "Operational"}
          </strong>
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

            <ShieldAlert
              size={19}
              strokeWidth={1.7}
            />
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

            <AlertTriangle
              size={19}
              strokeWidth={1.7}
            />
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

            <CheckCircle2
              size={19}
              strokeWidth={1.7}
            />
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
            <span>Average risk score</span>

            <ShieldAlert
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {isLoading ? "—" : averageRiskScore}
          </div>

          <div className="metric-footer">
            <span>
              {transactions.length} transactions evaluated
            </span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid risk-dashboard-grid">
        <article className="panel activity-panel">
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

                const isSelected =
                  selectedTransaction?.id === transaction.id;

                return (
                  <button
                    className={`table-row risk-table-row ${
                      isSelected ? "selected" : ""
                    }`}
                    key={transaction.id}
                    type="button"
                    onClick={() =>
                      setSelectedTransaction(transaction)
                    }
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
                  </button>
                );
              })
            )}
          </div>
        </article>

        <article className="panel risk-detail-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                Decision context
              </span>

              <h3>Selected assessment</h3>
            </div>
          </div>

          {selectedTransaction ? (
            <div className="risk-detail">
              <div className="risk-detail-header">
                <div>
                  <span className="risk-detail-merchant">
                    {selectedTransaction.merchant}
                  </span>

                  <span className="risk-detail-time">
                    {formatDate(
                      selectedTransaction.timestamp,
                    )}
                  </span>
                </div>

                <span
                  className={`status-pill ${
                    selectedTransaction.risk.risk_level ===
                      "HIGH" ||
                    selectedTransaction.risk.risk_level ===
                      "MEDIUM"
                      ? "review"
                      : "approved"
                  }`}
                >
                  {selectedTransaction.risk.risk_level}
                </span>
              </div>

              <div className="risk-detail-score">
                <div>
                  <span className="risk-detail-label">
                    Risk score
                  </span>

                  <strong>
                    {selectedTransaction.risk.risk_score}
                  </strong>
                </div>

                <div>
                  <span className="risk-detail-label">
                    Decision
                  </span>

                  <strong>
                    {selectedTransaction.risk.decision}
                  </strong>
                </div>
              </div>

              <div className="risk-detail-amount">
                <span>Transaction amount</span>

                <strong>
                  {formatCurrency(
                    selectedTransaction.amount,
                    selectedTransaction.currency,
                  )}
                </strong>
              </div>

              <div className="risk-signals">
                <div className="risk-signals-heading">
                  <span>Detected signals</span>

                  <strong>
                    {selectedTransaction.risk.reasons.length}
                  </strong>
                </div>

                {selectedTransaction.risk.reasons.length ===
                0 ? (
                  <div className="risk-no-signals">
                    <CheckCircle2 size={15} />

                    <span>
                      No elevated risk signals detected.
                    </span>
                  </div>
                ) : (
                  selectedTransaction.risk.reasons.map(
                    (reason) => (
                      <div
                        className="risk-signal"
                        key={reason}
                      >
                        <ShieldAlert size={14} />

                        <span>{reason}</span>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Select a transaction to inspect its risk
              assessment.
            </div>
          )}
        </article>
      </section>
    </>
  );
}

export default Risk;