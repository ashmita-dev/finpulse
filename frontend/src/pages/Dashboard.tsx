import { useMemo } from "react";
import {
  Activity,
  ChevronDown,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";

import type { Transaction } from "../types/transaction";

interface DashboardProps {
  transactions: Transaction[];
  isLoading: boolean;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function Dashboard({
  transactions,
  isLoading,
}: DashboardProps) {
  const totalSpending = useMemo(() => {
    return transactions.reduce(
      (total, transaction) => total + Number(transaction.amount),
      0,
    );
  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

  const highRiskCount = transactions.filter(
    (transaction) => Number(transaction.amount) >= 50000,
  ).length;

  const reviewCount = transactions.filter(
    (transaction) =>
      Number(transaction.amount) >= 10000 &&
      Number(transaction.amount) < 50000,
  ).length;

  const approvedCount = Math.max(
    transactions.length - highRiskCount - reviewCount,
    0,
  );

  return (
    <>
      <div className="intro-row">
        <div>
          <h2>Financial overview.</h2>
          <p>
            Monitor spending, transactions and risk activity in real time.
          </p>
        </div>

        <div className="date-display">
          <span>Today</span>
          <strong>05 Sep 2026</strong>
        </div>
      </div>

      <section className="metrics-grid">
        <article className="metric-card primary">
          <div className="metric-header">
            <span>Available balance</span>
            <Wallet size={19} strokeWidth={1.7} />
          </div>

          <div className="metric-value">₹84,250.00</div>

          <div className="metric-footer positive">
            <TrendingUp size={15} />
            <span>+8.4% this month</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Tracked spending</span>
            <CreditCard size={19} strokeWidth={1.7} />
          </div>

          <div className="metric-value">
            {isLoading
              ? "—"
              : formatCurrency(
                  totalSpending,
                  transactions[0]?.currency ?? "INR",
                )}
          </div>

          <div className="metric-footer">
            <span>{transactions.length} transactions loaded</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Risk activity</span>
            <ShieldAlert size={19} strokeWidth={1.7} />
          </div>

          <div className="metric-value">
            {String(highRiskCount + reviewCount).padStart(2, "0")}
          </div>

          <div className="metric-footer warning">
            <span>{reviewCount} require review</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Transactions</span>
            <Activity size={19} strokeWidth={1.7} />
          </div>

          <div className="metric-value">
            {isLoading ? "—" : transactions.length}
          </div>

          <div className="metric-footer">
            <span>From FinPulse API</span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel spending-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Cash flow</span>
              <h3>Spending trajectory</h3>
            </div>

            <button className="period-selector">
              Recent activity
              <ChevronDown size={15} />
            </button>
          </div>

          <div className="chart-placeholder">
            <div className="chart-grid">
              <span />
              <span />
              <span />
              <span />
            </div>

            <svg
              className="spending-chart"
              viewBox="0 0 760 230"
              preserveAspectRatio="none"
              aria-label="Spending trajectory"
            >
              <defs>
                <linearGradient
                  id="areaGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="rgba(42, 213, 164, 0.20)"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgba(42, 213, 164, 0)"
                  />
                </linearGradient>
              </defs>

              <path
                className="chart-area"
                d="M0,170 C70,150 95,158 150,130 C210,100 235,130 290,112 C345,92 365,110 420,82 C480,50 500,96 555,76 C620,52 650,70 700,42 C725,28 745,38 760,25 L760,230 L0,230 Z"
              />

              <path
                className="chart-line"
                d="M0,170 C70,150 95,158 150,130 C210,100 235,130 290,112 C345,92 365,110 420,82 C480,50 500,96 555,76 C620,52 650,70 700,42 C725,28 745,38 760,25"
              />

              <circle
                cx="760"
                cy="25"
                r="5"
                className="chart-point"
              />
            </svg>

            <div className="chart-labels">
              <span>30 Aug</span>
              <span>31 Aug</span>
              <span>01 Sep</span>
              <span>02 Sep</span>
              <span>03 Sep</span>
              <span>04 Sep</span>
              <span>05 Sep</span>
            </div>
          </div>
        </article>

        <article className="panel risk-summary">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Risk engine</span>
              <h3>Risk activity</h3>
            </div>
          </div>

          <div className="risk-score-block">
            <div className="risk-score">
              {highRiskCount > 0 ? "72" : "18"}
            </div>

            <div>
              <span className="risk-label">Current risk index</span>
              <span className="risk-change">
                Based on transaction activity
              </span>
            </div>
          </div>

          <div className="risk-bars">
            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator high" />
                High risk
                <strong>{highRiskCount}</strong>
              </div>

              <div className="risk-bar">
                <span
                  className="high-fill"
                  style={{
                    width: `${Math.min(
                      highRiskCount * 12,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator medium" />
                Review
                <strong>{reviewCount}</strong>
              </div>

              <div className="risk-bar">
                <span
                  className="medium-fill"
                  style={{
                    width: `${Math.min(
                      reviewCount * 12,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator low" />
                Approved
                <strong>{approvedCount}</strong>
              </div>

              <div className="risk-bar">
                <span
                  className="low-fill"
                  style={{
                    width: `${Math.min(
                      approvedCount * 8,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel activity-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Live feed</span>
            <h3>Recent activity</h3>
          </div>

          <div className="stream-status">
            <span />
            Event stream connected
          </div>
        </div>

        <div className="activity-table">
          <div className="table-row table-heading">
            <span>Transaction</span>
            <span>Category</span>
            <span>Time</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          {isLoading ? (
            <div className="empty-state">
              Loading transactions…
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="empty-state">
              No transactions found for this user.
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <div className="table-row" key={transaction.id}>
                <div className="transaction-cell">
                  <div className="merchant-icon">
                    {transaction.merchant.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{transaction.merchant}</strong>
                    <span>
                      {transaction.location ??
                        "Location unavailable"}
                    </span>
                  </div>
                </div>

                <span>{transaction.category}</span>

                <span>{formatTime(transaction.timestamp)}</span>

                <strong>
                  {formatCurrency(
                    Number(transaction.amount),
                    transaction.currency,
                  )}
                </strong>

                <span className="status-pill approved">
                  {transaction.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;