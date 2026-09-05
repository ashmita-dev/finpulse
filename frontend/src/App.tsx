import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import "./App.css";
import { getUserTransactions } from "./services/api";
import type { Transaction } from "./types/transaction";

import Analytics from "./pages/Analytics";
import Dashboard from "./pages/Dashboard";
import Risk from "./pages/Risk";
import Transactions from "./pages/Transactions";

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

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();

  useEffect(() => {
    async function loadTransactions() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getUserTransactions(1);

        setTransactions(data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load transactions.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const currentPage =
    navigation.find((item) => item.path === location.pathname)
      ?.label ?? "Overview";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>

          <div>
            <div className="brand-name">FinPulse</div>
            <div className="brand-caption">
              Financial intelligence
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">Workspace</span>

          <nav className="navigation">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={18} strokeWidth={1.8} />
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
            <div className="avatar">AM</div>

            <div className="user-details">
              <span className="user-name">Admin User</span>
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
          <div>
            <span className="eyebrow">
              Financial intelligence
            </span>

            <h1>{currentPage}</h1>
          </div>

          <div className="topbar-actions">
            <div className="live-indicator">
              <span className="live-dot" />
              LIVE
            </div>

            <button
              className="icon-button"
              aria-label="Notifications"
            >
              <Bell size={19} strokeWidth={1.8} />
              <span className="notification-dot" />
            </button>
          </div>
        </header>

        <section className="page-content">
          {error && (
            <div className="error-banner">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  transactions={transactions}
                  isLoading={isLoading}
                />
              }
            />

            <Route
              path="/transactions"
              element={
                <Transactions
                  transactions={transactions}
                  isLoading={isLoading}
                />
              }
            />

            <Route
              path="/risk"
              element={
                <Risk transactions={transactions} />
              }
            />

            <Route
              path="/analytics"
              element={
                <Analytics
                  transactions={transactions}
                />
              }
            />
          </Routes>
        </section>
      </main>
    </div>
  );
}

export default App;