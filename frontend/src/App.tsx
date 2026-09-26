import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  API_BASE_URL,
  TRANSACTIONS_WS_URL,
} from "./config";

import {
  useAppDispatch,
  useAppSelector,
} from "./app/hooks";
import {
  fetchUserTransactions,
} from "./features/transactions/transactionsSlice";
import { getUserRiskTransactions } from "./services/api";
import type {
  TransactionWithRisk,
} from "./types/transaction";
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

const currencyOptions = [
  "INR",
  "USD",
  "EUR",
  "GBP",
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

  const [selectedCurrency, setSelectedCurrency] =
    useState("INR");

  const dispatch = useAppDispatch();

  const loadRiskData = useCallback(async () => {
    try {
      setRiskLoading(true);
      setRiskError(null);

      const data = await getUserRiskTransactions(1);

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
  }, []);

  useEffect(() => {
    void dispatch(fetchUserTransactions(1));
  }, [dispatch]);

  useEffect(() => {
    void loadRiskData();
  }, [loadRiskData]);

  useEffect(() => {
    const socket = new WebSocket(
      TRANSACTIONS_WS_URL,
    );

    socket.onopen = () => {
      console.log("✅ WebSocket connected");

      setRiskError(null);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        console.log(
          "📩 WebSocket message received:",
          message,
        );

        if (message.type === "transaction.created") {
          void dispatch(
            fetchUserTransactions(1),
          );

          void loadRiskData();
        }
      } catch {
        console.error(
          "❌ Invalid WebSocket message:",
          event.data,
        );

        setRiskError(
          "Received an invalid real-time update.",
        );
      }
    };

    socket.onerror = (socketError) => {
      console.error(
        "❌ WebSocket error:",
        socketError,
      );

      setRiskError(
        "Real-time transaction updates are unavailable.",
      );
    };

    socket.onclose = (event) => {
      console.log(
        "🔌 WebSocket disconnected:",
        event.code,
        event.reason,
      );
    };

    return () => {
      socket.close();
    };
  }, [dispatch, loadRiskData]);

  const currencyTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        transaction.currency === selectedCurrency,
    );
  }, [transactions, selectedCurrency]);

  const totalSpending = useMemo(() => {
    return currencyTransactions.reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0,
    );
  }, [currencyTransactions]);

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

  const spendingChart = useMemo(() => {
    const dateKey = (date: Date) => {
      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1,
      ).padStart(2, "0");

      const day = String(
        date.getDate(),
      ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const latestTimestamp =
      currencyTransactions.reduce(
        (latest, transaction) => {
          const timestamp = new Date(
            transaction.timestamp,
          ).getTime();

          return timestamp > latest
            ? timestamp
            : latest;
        },
        0,
      );

    const anchorDate = new Date(
      latestTimestamp || Date.now(),
    );

    const dailySpending = new Map<
      string,
      number
    >();

    currencyTransactions.forEach(
      (transaction) => {
        const key = dateKey(
          new Date(transaction.timestamp),
        );

        dailySpending.set(
          key,
          (dailySpending.get(key) ?? 0) +
            Number(transaction.amount),
        );
      },
    );

    const dates = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(anchorDate);

        date.setHours(0, 0, 0, 0);

        date.setDate(
          anchorDate.getDate() -
            (6 - index),
        );

        return date;
      },
    );

    const values = dates.map(
      (date) =>
        dailySpending.get(dateKey(date)) ??
        0,
    );

    const maxValue = Math.max(
      ...values,
      1,
    );

    const width = 760;
    const baseline = 205;
    const chartHeight = 165;

    const points = values.map(
      (value, index) => {
        const x =
          values.length === 1
            ? width
            : (index /
                (values.length - 1)) *
              width;

        const y =
          baseline -
          (value / maxValue) *
            chartHeight;

        return {
          x,
          y,
        };
      },
    );

    const linePath = points
      .map((point, index) => {
        const command =
          index === 0 ? "M" : "L";

        return `${command}${point.x.toFixed(
          2,
        )},${point.y.toFixed(2)}`;
      })
      .join(" ");

    const areaPath =
      `${linePath} L${width},230 L0,230 Z`;

    const labels = dates.map(
      (date) =>
        new Intl.DateTimeFormat("en-IN", {
          day: "2-digit",
          month: "short",
        }).format(date),
    );

    const lastPoint =
      points[points.length - 1] ?? {
        x: width,
        y: baseline,
      };

    return {
      labels,
      linePath,
      areaPath,
      lastPoint,
      hasData: currencyTransactions.length > 0,
    };
  }, [currencyTransactions]);

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
          <div
            className="metric-header"
            style={{
              alignItems: "center",
            }}
          >
            <span>Tracked spending</span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <select
                value={selectedCurrency}
                onChange={(event) =>
                  setSelectedCurrency(
                    event.target.value,
                  )
                }
                aria-label="Spending currency"
                style={{
                  border:
                    "1px solid #dfe7e3",
                  borderRadius: 8,
                  padding:
                    "5px 8px",
                  background:
                    "rgba(255,255,255,0.8)",
                  color: "#26342f",
                  fontSize: 12,
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {currencyOptions.map(
                  (currency) => (
                    <option
                      key={currency}
                      value={currency}
                    >
                      {currency}
                    </option>
                  ),
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
              : formatCurrency(
                  totalSpending.toFixed(2),
                  selectedCurrency,
                )}
          </div>

          <div className="metric-footer positive">
            <TrendingUp size={15} />

            <span>
              {currencyTransactions.length}{" "}
              {selectedCurrency} transactions
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
              ? "—"
              : riskActivityCount}
          </div>

          <div className="metric-footer warning">
            <span>
              {riskLoading
                ? "Evaluating risk"
                : `${highRiskCount} high · ${reviewCount} review`}
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
              ? "—"
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
              ? "—"
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

              <h3>
                Spending trajectory ·{" "}
                {selectedCurrency}
              </h3>
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

            {spendingChart.hasData ? (
              <>
                <svg
                  className="spending-chart"
                  viewBox="0 0 760 230"
                  preserveAspectRatio="none"
                  aria-label={`${selectedCurrency} spending trajectory`}
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
                    d={
                      spendingChart.areaPath
                    }
                  />

                  <path
                    className="chart-line"
                    d={
                      spendingChart.linePath
                    }
                  />

                  <circle
                    cx={
                      spendingChart.lastPoint
                        .x
                    }
                    cy={
                      spendingChart.lastPoint
                        .y
                    }
                    r="5"
                    className="chart-point"
                  />
                </svg>

                <div className="chart-labels">
                  {spendingChart.labels.map(
                    (label, index) => (
                      <span
                        key={`${label}-${index}`}
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                No {selectedCurrency} transactions
                available for the spending chart.
              </div>
            )}
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
                ? "—"
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
                    ? "—"
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
                    ? "—"
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
                    ? "—"
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
              Loading transactions…
            </div>
          ) : recentTransactions.length ===
            0 ? (
            <div className="empty-state">
              No transactions found for this
              user.
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

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  riskLevel: string;
  createdAt: string;
};

function App() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const seenNotificationIds = useRef<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const loadExistingNotifications = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/users/1/risk`,
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load risk assessments: ${response.status}`,
          );
        }

        const transactions = await response.json();

        const existingNotifications: NotificationItem[] =
          transactions
            .filter((transaction: any) => {
              const risk = transaction?.risk;

              if (!risk) {
                return false;
              }

              const riskLevel = String(
                risk.risk_level ?? "",
              ).toUpperCase();

              const decision = String(
                risk.decision ?? "",
              ).toUpperCase();

              return (
                riskLevel === "HIGH" ||
                decision === "BLOCK"
              );
            })
            .map((transaction: any) => {
              const risk = transaction?.risk;

              if (!risk) {
                return null;
              }

              const riskLevel = String(
                risk.risk_level ?? "",
              ).toUpperCase();

              seenNotificationIds.current.add(
                String(transaction.id),
              );

              return {
                id: String(transaction.id),
                title:
                  "High-risk transaction detected",
                message: `${transaction.merchant} triggered a ${riskLevel.toLowerCase()} risk alert.`,
                riskLevel,
                createdAt:
                  transaction.timestamp,
              };
            })
            .filter(
              (
                notification: NotificationItem | null,
              ): notification is NotificationItem =>
                notification !== null,
            )
            .slice(0, 10);

        setNotifications(existingNotifications);
        setUnreadCount(0);
      } catch (error) {
        console.error(
          "Unable to load existing notifications:",
          error,
        );
      }
    };

    void loadExistingNotifications();

    const socket = new WebSocket(
      TRANSACTIONS_WS_URL,
    );

    socket.onopen = () => {
      console.log(
        "Notification WebSocket connected",
      );
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (
          message.type !==
          "transaction.created"
        ) {
          return;
        }

        const transaction = message.data;
        const risk = transaction?.risk;

        if (!transaction || !risk) {
          return;
        }

        const riskLevel = String(
          risk.risk_level ?? "",
        ).toUpperCase();

        const decision = String(
          risk.decision ?? "",
        ).toUpperCase();

        const isHighRisk =
          riskLevel === "HIGH" ||
          decision === "BLOCK";

        if (!isHighRisk) {
          return;
        }

        const notificationId = String(
          transaction.id,
        );

        if (
          seenNotificationIds.current.has(
            notificationId,
          )
        ) {
          return;
        }

        seenNotificationIds.current.add(
          notificationId,
        );

        setNotifications((current) =>
          [
            {
              id: notificationId,
              title:
                "High-risk transaction detected",
              message: `${transaction.merchant} triggered a ${riskLevel.toLowerCase()} risk alert.`,
              riskLevel,
              createdAt:
                transaction.timestamp ??
                new Date().toISOString(),
            },
            ...current,
          ].slice(0, 10),
        );

        setUnreadCount(
          (count) => count + 1,
        );

        console.log(
          "High-risk notification added",
        );
      } catch (error) {
        console.error(
          "Unable to process notification update:",
          error,
        );
      }
    };

    socket.onerror = (error) => {
      console.error(
        "Notification WebSocket error:",
        error,
      );
    };

    socket.onclose = (event) => {
      console.log(
        "Notification WebSocket disconnected:",
        event.code,
        event.reason,
      );
    };

    return () => {
      socket.close();
    };
  }, []);

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

            <div
              style={{
                position: "relative",
              }}
            >
              <button
                className="icon-button"
                aria-label="Notifications"
                type="button"
                onClick={() => {
                  setNotificationsOpen(
                    (open) => !open,
                  );

                  setUnreadCount(0);
                }}
              >
                <Bell
                  size={19}
                  strokeWidth={1.8}
                />

                {unreadCount > 0 && (
                  <span className="notification-dot" />
                )}
              </button>

              {notificationsOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 12px)",
                    width: 320,
                    maxWidth:
                      "calc(100vw - 32px)",
                    background: "white",
                    border:
                      "1px solid #dfe7e3",
                    borderRadius: 14,
                    padding: 16,
                    boxShadow:
                      "0 14px 40px rgba(0,0,0,0.12)",
                    zIndex: 20,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    Notifications
                  </strong>

                  {notifications.length ===
                  0 ? (
                    <p
                      style={{
                        margin: 0,
                        color: "#718078",
                        fontSize: 14,
                      }}
                    >
                      No high-risk alerts yet.
                    </p>
                  ) : (
                    notifications.map(
                      (notification) => (
                        <div
                          key={notification.id}
                          style={{
                            borderTop:
                              "1px solid #edf1ef",
                            paddingTop: 12,
                            marginTop: 12,
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              color: "#c24141",
                              fontSize: 14,
                            }}
                          >
                            {
                              notification.title
                            }
                          </strong>

                          <p
                            style={{
                              margin:
                                "6px 0 0",
                              color: "#596861",
                              fontSize: 13,
                              lineHeight: 1.5,
                            }}
                          >
                            {
                              notification.message
                            }
                          </p>
                        </div>
                      ),
                    )
                  )}
                </div>
              )}
            </div>
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
