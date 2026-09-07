import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { useAppSelector } from "../app/hooks";

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

function Transactions() {
  const {
    items: transactions,
    isLoading,
    error,
  } = useAppSelector((state) => state.transactions);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          transactions.map(
            (transaction) => transaction.category,
          ),
        ),
      ),
    ];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        transaction.merchant
          .toLowerCase()
          .includes(normalizedSearch) ||
        transaction.category
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        category === "All" ||
        transaction.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [transactions, search, category]);

  return (
    <section className="page-content">
      <div className="intro-row">
        <div>
          <h2>Transactions.</h2>

          <p>
            Review every transaction flowing through the
            FinPulse system.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">
              Transaction ledger
            </span>

            <h3>
              {filteredTransactions.length} transactions
            </h3>
          </div>
        </div>

        <div className="transaction-toolbar">
          <div className="transaction-search">
            <Search
              size={15}
              strokeWidth={1.8}
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search merchant or category..."
              aria-label="Search transactions"
            />
          </div>

          <div className="transaction-filter">
            <SlidersHorizontal
              size={14}
              strokeWidth={1.8}
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              aria-label="Filter by category"
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="activity-table">
          <div className="table-row table-heading">
            <span>Transaction</span>
            <span>Category</span>
            <span>Timestamp</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          {isLoading ? (
            <div className="empty-state">
              Loading transactions…
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="empty-state">
              No transactions match your search.
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
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

                <span>
                  {transaction.category}
                </span>

                <span>
                  {formatDate(
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
            ))
          )}
        </div>
      </section>
    </section>
  );
}

export default Transactions;