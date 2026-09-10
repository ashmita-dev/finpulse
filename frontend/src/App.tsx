import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  NavLink,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

import {
  useAppDispatch,
  useAppSelector,
} from "./app/hooks";
import {
  fetchUserTransactions,
} from "./features/transactions/transactionsSlice";
import { getUserRiskTransactions } from "./services/api";
import type { TransactionWithRisk } from "./types/transaction";
import Transactions from "./pages/Transactions";
import Risk from "./pages/Risk";
import Analytics from "./pages/Analytics";

const navigation = [
  {
    label: "Overview",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: CreditCard,
  },
  {
    label: "Risk Monitor",
    path: "/risk",
    icon: ShieldAlert,
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
];

function formatCurrency(
  amount: string,
  currency: string,
) {
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
  const {
    items: transactions,
    isLoading,
    error,
  } = useAppSelector(
    (state) => state.transactions,
  );

  const [riskTransactions, setRiskTransactions] =
    useState<TransactionWithRisk[]>([]);

  const [riskLoading, setRiskLoading] =
    useState(true);

  const [riskError, setRiskError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadRiskData() {
      try {
        setRiskLoading(true);
        setRiskError(null);

        const data =
          await getUserRiskTransactions(1);

        setRiskTransactions(data);
      } catch (requestError) {
        setRiskError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load risk data.",
        );
      } finally {
        setRiskLoading(false);
      }
    }

    loadRiskData();
  }, []);

  const totalSpending = useMemo(() => {
    return transactions.reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0,
    );
  }, [transactions]);

  const highRiskCount = useMemo(() => {
    return riskTransactions.filter(
      (transaction) =>
        transaction.risk.risk_level === "HIGH",
    ).length;
  }, [riskTransactions]);

  const reviewCount = useMemo(() => {
    return riskTransactions.filter(
      (transaction) =>
        transaction.risk.risk_level === "MEDIUM",
    ).length;
  }, [riskTransactions]);

  const approvedCount = useMemo(() => {
    return riskTransactions.filter(
      (transaction) =>
        transaction.risk.risk_level === "LOW",
    ).length;
  }, [riskTransactions]);

  const riskActivityCount =
    highRiskCount + reviewCount;

  const averageRiskScore = useMemo(() => {
    if (riskTransactions.length === 0) {
      return 0;
    }

    const total = riskTransactions.reduce(
      (sum, transaction) =>
        sum + transaction.risk.risk_score,
      0,
    );

    return Math.round(
      total / riskTransactions.length,
    );
  }, [riskTransactions]);

  const recentTransactions =
    transactions.slice(0, 5);

  const totalRiskTransactions =
    riskTransactions.length;

  const highRiskWidth =
    totalRiskTransactions > 0
      ? `${(highRiskCount / totalRiskTransactions) * 100}%`
      : "0%";

  const reviewWidth =
    totalRiskTransactions > 0
      ? `${(reviewCount / totalRiskTransactions) * 100}%`
      : "0%";

  const approvedWidth =
    totalRiskTransactions > 0
      ? `${(approvedCount / totalRiskTransactions) * 100}%`
      : "0%";

  return (
    <>
      <div className="intro-row page-intro">
        <div>
          <span className="section-overline">
            Portfolio overview
          </span>

          <h2>Financial overview.</h2>

          <p>
            Monitor spending, transactions and risk
            activity in real time.
          </p>
        </div>

        <div className="date-display">
          <span>Today</span>

          <strong>
            {new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date())}
          </strong>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {riskError && (
        <div className="error-banner">
          <ShieldAlert size={16} />
          <span>{riskError}</span>
        </div>
      )}

      <section className="metrics-grid">
        <article className="metric-card primary reveal-card">
          <div className="metric-header">
            <span>Tracked spending</span>

            <Wallet
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {isLoading
              ? "â€”"
              : formatCurrency(
                  totalSpending.toFixed(2),
                  transactions[0]?.currency ??
                    "INR",
                )}
          </div>

          <div className="metric-footer positive">
            <TrendingUp size={15} />

            <span>
              {transactions.length} recorded transactions
            </span>
          </div>
        </article>

        <article className="metric-card reveal-card">
          <div className="metric-header">
            <span>Risk activity</span>

            <ShieldAlert
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {riskLoading
              ? "â€”"
              : riskActivityCount}
          </div>

          <div className="metric-footer warning">
            <span>
              {riskLoading
                ? "Evaluating risk"
                : `${highRiskCount} high Â· ${reviewCount} review`}
            </span>
          </div>
        </article>

        <article className="metric-card reveal-card">
          <div className="metric-header">
            <span>Average risk score</span>

            <ShieldAlert
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {riskLoading
              ? "â€”"
              : averageRiskScore}
          </div>

          <div className="metric-footer">
            <span>
              {riskTransactions.length} assessments
            </span>
          </div>
        </article>

        <article className="metric-card reveal-card">
          <div className="metric-header">
            <span>Transactions</span>

            <Activity
              size={19}
              strokeWidth={1.7}
            />
          </div>

          <div className="metric-value">
            {isLoading
              ? "â€”"
              : transactions.length}
          </div>

          <div className="metric-footer">
            <span>From FinPulse API</span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel spending-panel reveal-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                Cash flow
              </span>

              <h3>Spending trajectory</h3>
            </div>

            <button
              className="period-selector"
              type="button"
            >
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
                    stopColor="rgba(42, 213, 164, 0.18)"
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

        <article className="panel risk-summary reveal-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                Risk engine
              </span>

              <h3>Risk activity</h3>
            </div>

            <NavLink
              to="/risk"
              className="text-button"
            >
              View all
            </NavLink>
          </div>

          <div className="risk-score-block">
            <div className="risk-score">
              {riskLoading
                ? "â€”"
                : averageRiskScore}
            </div>

            <div>
              <span className="risk-label">
                Average risk index
              </span>

              <span className="risk-change">
                {riskLoading
                  ? "Evaluating transactions"
                  : `${riskTransactions.length} assessments`}
              </span>
            </div>
          </div>

          <div className="risk-bars">
            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator high" />

                High risk

                <strong>
                  {riskLoading
                    ? "â€”"
                    : highRiskCount}
                </strong>
              </div>

              <div className="risk-bar">
                <span
                  className="high-fill"
                  style={{
                    width: highRiskWidth,
                  }}
                />
              </div>
            </div>

            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator medium" />

                Review

                <strong>
                  {riskLoading
                    ? "â€”"
                    : reviewCount}
                </strong>
              </div>

              <div className="risk-bar">
                <span
                  className="medium-fill"
                  style={{
                    width: reviewWidth,
                  }}
                />
              </div>
            </div>

            <div className="risk-bar-row">
              <div className="risk-bar-label">
                <span className="risk-indicator low" />

                Approved

                <strong>
                  {riskLoading
                    ? "â€”"
                    : approvedCount}
                </strong>
              </div>

              <div className="risk-bar">
                <span
                  className="low-fill"
                  style={{
                    width: approvedWidth,
                  }}
                />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="panel activity-panel reveal-panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">
              Recent feed
            </span>

            <h3>Recent activity</h3>
          </div>

          <div className="stream-status">
            <span />

            API data synced
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
              Loading transactionsâ€¦
            </div>
          ) : recentTransactions.length ===
            0 ? (
            <div className="empty-state">
              No transactions found for this user.
            </div>
          ) : (
            recentTransactions.map(
              (transaction, index) => (
                <div
                  className="table-row activity-row"
                  key={transaction.id}
                  style={{
                    animationDelay: `${index * 45}ms`,
                  }}
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

                  <span>
                    {transaction.category}
                  </span>

                  <span>
                    {formatTime(
                      transaction.timestamp,
                    )}
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
              ),
            )
          )}
        </div>
      </section>
    </>
  );
}

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchUserTransactions(1));
  }, [dispatch]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            F
          </div>

          <div>
            <div className="brand-name">
              FinPulse
            </div>

            <div className="brand-caption">
              Financial intelligence
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">
            Workspace
          </span>

          <nav className="navigation">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `nav-item ${
                      isActive ? "active" : ""
                    }`
                  }
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                  />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot" />

            <div>
              <span className="status-title">
                Systems operational
              </span>

              <span className="status-subtitle">
                API connected
              </span>
            </div>
          </div>

          <div className="user-profile">
            <div className="avatar">
              AM
            </div>

            <div className="user-details">
              <span className="user-name">
                Admin User
              </span>

              <span className="user-role">
                Risk operations
              </span>
            </div>

            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-context">
            <span className="topbar-brand">
              FINPULSE
            </span>

            <span className="topbar-divider">
              /
            </span>

            <span>
              Operations workspace
            </span>
          </div>

          <div className="topbar-actions">
            <div className="live-indicator">
              <span className="live-dot" />
              LIVE
            </div>

            <button
              className="icon-button"
              aria-label="Notifications"
              type="button"
            >
              <Bell
                size={19}
                strokeWidth={1.8}
              />

              <span className="notification-dot" />
            </button>
          </div>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <section className="page-content">
                <Dashboard />
              </section>
            }
          />

          <Route
            path="/transactions"
            element={<Transactions />}
          />

          <Route
            path="/risk"
            element={
              <section className="page-content">
                <Risk />
              </section>
            }
          />

          <Route
            path="/analytics"
            element={
              <section className="page-content">
                <Analytics />
              </section>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;