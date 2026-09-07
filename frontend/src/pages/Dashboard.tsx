import { useEffect, useMemo } from "react";
import {
  Activity,
  ChevronDown,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchUserTransactions } from "../features/transactions/transactionsSlice";

import type { Transaction } from "../types/transaction";

function formatCurrency(amount: string, currency: string) {
  const numericAmount = Number(amount);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function Dashboard() {
  const dispatch = useAppDispatch();

  const {
    items: transactions,
    isLoading,
    error,
  } = useAppSelector((state) => state.transactions);

  useEffect(() => {
    if (transactions.length === 0) {
      dispatch(fetchUserTransactions(1));
    }
  }, [dispatch, transactions.length]);

  const totalSpending = useMemo(() => {
    return transactions.reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0,
    );
  }, [transactions]);

  const recentTransactions: Transaction[] =
    transactions.slice(0, 5);

  return (
    <section className="page-content">
      <div className="intro-row">
        <div>
          <h2>Financial overview.</h2>

          <p>
            Monitor spending, transactions and risk activity
            in real time.
          </p>
        </div>

        <div className="date-display">
          <span>Today</span>
          <strong>05 Sep 2026</strong>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="metrics-grid">
        <article className="metric-card primary">
          <div className="metric-header">
            <span>Available balance</span>
            <Wallet size={19} strokeWidth={1.7} />
          </div>

          <div className="metric-value">
            ₹84,250.00
          </div>

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
                  totalSpending.toFixed(2),
                  transactions[0]?.currency ?? "INR",
                )}
          </div>

          <div className="metric-footer">
            <span>
              {transactions.length} transactions loaded
            </span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-header">
            <span>Risk activity</span>
            <ShieldAlert
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">07</div>

          <div className="metric-footer warning">
            <span>3 require review</span>
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
              <span className="panel-kicker">
                Cash flow
              </span>

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
              <span className="panel-kicker">
                Risk engine
              </span>

              <h3>Risk activity</h3>
            </div>

            <button className="text-button">
              View all
            </button>
          </div>

          <div className="risk-score-block">
            <div className="risk-score">72</div>

            <div>
              <span className="risk-label">
                Current risk index
              </span>

              <span className="risk-change">
                ↑ 12% vs yesterday
              </span>
            </div>
          </div>

          <div className="risk-bars">
            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator high" />
                High risk
                <strong>2</strong>
              </div>

              <div className="risk-bar">
                <span className="high-fill" />
              </div>
            </div>

            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator medium" />
                Review
                <strong>3</strong>
              </div>

              <div className="risk-bar">
                <span className="medium-fill" />
              </div>
            </div>

            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator low" />
                Approved
                <strong>
                  {Math.max(
                    transactions.length - 5,
                    0,
                  )}
                </strong>
              </div>

              <div className="risk-bar">
                <span className="low-fill" />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel activity-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">
              Live feed
            </span>

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
              <div
                className="table-row"
                key={transaction.id}
              >
                <div className="transaction-cell">
                  <div className="merchant-icon">
                    {transaction.merchant
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {transaction.merchant}
                    </strong>

                    <span>
                      {transaction.location ??
                        "Location unavailable"}
                    </span>
                  </div>
                </div>

                <span>{transaction.category}</span>

                <span>
                  {formatTime(transaction.timestamp)}
                </span>

                <strong>
                  {formatCurrency(
                    transaction.amount,
                    transaction.currency,
                  )}
                </strong>

                <span
                  className={`status-pill ${
                    transaction.status.toLowerCase() ===
                    "completed"
                      ? "approved"
                      : "review"
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

export default Dashboard;