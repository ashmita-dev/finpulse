import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import type { Transaction } from "../types/transaction";

interface TransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

function formatCurrency(amount: string, currency: string) {
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

function Transactions({
  transactions,
  isLoading,
}: TransactionsProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(transactions.map((transaction) => transaction.category)),
      ),
    ];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

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
        category === "All" || transaction.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [transactions, search, category]);

  return (
    <>
      <div className="intro-row">
        <div>
          <h2>Transactions.</h2>
          <p>
            Review every transaction flowing through the FinPulse system.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="panel-kicker">Transaction ledger</span>
            <h3>
              {filteredTransactions.length} transactions
            </h3>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "20px 21px",
            borderTop: "1px solid #eef0ee",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "9px",
              padding: "9px 11px",
              border: "1px solid #e4e8e4",
              borderRadius: "7px",
              background: "#fafbf9",
            }}
          >
            <Search size={15} color="#89948f" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search merchant or category..."
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background: "transparent",
                color: "#17201d",
                fontSize: "11px",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 11px",
              border: "1px solid #e4e8e4",
              borderRadius: "7px",
              background: "#fafbf9",
            }}
          >
            <SlidersHorizontal size={14} color="#89948f" />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              style={{
                border: 0,
                outline: 0,
                background: "transparent",
                color: "#53605b",
                fontSize: "11px",
              }}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
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

                <span>{formatDate(transaction.timestamp)}</span>

                <strong>
                  {formatCurrency(
                    transaction.amount,
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

export default Transactions;