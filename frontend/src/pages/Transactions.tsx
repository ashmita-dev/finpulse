import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleX,
  MapPin,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Smartphone,
  X,
} from "lucide-react";

import {
  useAppDispatch,
  useAppSelector,
} from "../app/hooks";

import {
  fetchUserTransactions,
} from "../features/transactions/transactionsSlice";

import {
  createTransaction,
  getUserRiskTransactions,
} from "../services/api";
import type {
  Transaction,
  TransactionWithRisk,
} from "../types/transaction";

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

function getRiskColor(level: string) {
  if (level === "HIGH") {
    return {
      background: "#ffebeb",
      color: "#c84d4d",
    };
  }

  if (level === "MEDIUM") {
    return {
      background: "#fff4df",
      color: "#a86b13",
    };
  }

  return {
    background: "#e4faf3",
    color: "#148f70",
  };
}

function Transactions() {
  const dispatch = useAppDispatch();
  const {
    items: transactions,
    isLoading,
    error,
  } = useAppSelector(
    (state) => state.transactions,
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const [riskTransactions, setRiskTransactions] =
    useState<TransactionWithRisk[]>([]);

  const [isRiskLoading, setIsRiskLoading] =
    useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdRisk, setCreatedRisk] =
    useState<TransactionWithRisk | null>(null);
  const [screeningTransaction, setScreeningTransaction] =
    useState<Transaction | null>(null);
  const [form, setForm] = useState({
    amount: "",
    merchant: "",
    category: "Shopping",
    currency: "INR",
    location: "Kolkata",
    device_id: "device_001",
  });

  function updateForm(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateTransaction() {
    setCreateError("");
    setCreatedRisk(null);
    setScreeningTransaction(null);

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setCreateError("Enter a valid transaction amount.");
      return;
    }

    if (!form.merchant.trim()) {
      setCreateError("Enter a merchant name.");
      return;
    }

    try {
      setIsCreating(true);

      const result = await createTransaction({
        user_id: 1,
        amount: form.amount,
        currency: form.currency,
        merchant: form.merchant.trim(),
        category: form.category,
        timestamp: new Date().toISOString(),
        location: form.location.trim() || null,
        device_id: form.device_id.trim() || null,
        status: "pending",
      });

      const pendingTransaction: Transaction = {
        id: result.id,
        user_id: result.user_id,
        amount: result.amount,
        currency: result.currency,
        merchant: result.merchant,
        category: result.category,
        timestamp: result.timestamp,
        location: result.location,
        device_id: result.device_id,
        status: "pending",
      };

      setScreeningTransaction(pendingTransaction);

      await dispatch(fetchUserTransactions(1));

      const screeningStartedAt = Date.now();

      let riskResult: TransactionWithRisk | null = null;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const riskTransactions = await getUserRiskTransactions(1);

        riskResult =
          riskTransactions.find(
            (transaction) => transaction.id === result.id,
          ) ?? null;

        if (riskResult) {
          break;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 500),
        );
      }

      const elapsedScreeningTime =
        Date.now() - screeningStartedAt;

      const minimumScreeningTime = 1000;

      if (elapsedScreeningTime < minimumScreeningTime) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            minimumScreeningTime - elapsedScreeningTime,
          ),
        );
      }

      if (riskResult) {
        setCreatedRisk(riskResult);

        setRiskTransactions((current) => {
          const existingIndex = current.findIndex(
            (transaction) => transaction.id === riskResult!.id,
          );

          if (existingIndex === -1) {
            return [riskResult!, ...current];
          }

          const updated = [...current];
          updated[existingIndex] = riskResult!;
          return updated;
        });

        await dispatch(fetchUserTransactions(1));
        setScreeningTransaction(null);
      } else {
        setCreatedRisk(null);
        setCreateError(
          "Transaction created successfully, but the risk assessment is still processing. Refreshing the transaction history will show the result once Kafka finishes processing.",
        );
      }
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create transaction.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  const createdRiskColor = createdRisk
    ? getRiskColor(createdRisk.risk.risk_level)
    : null;

  useEffect(() => {
    async function loadRiskData() {
      try {
        setIsRiskLoading(true);

        const data =
          await getUserRiskTransactions(1);

        setRiskTransactions(data);
      } catch {
        setRiskTransactions([]);
      } finally {
        setIsRiskLoading(false);
      }
    }

    loadRiskData();
  }, [transactions.length]);

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          transactions.map(
            (transaction) =>
              transaction.category,
          ),
        ),
      ),
    ];
  }, [transactions]);

  const displayTransactions = useMemo(() => {
    if (!screeningTransaction) {
      return transactions;
    }

    return [
      screeningTransaction,
      ...transactions.filter(
        (transaction) =>
          transaction.id !== screeningTransaction.id,
      ),
    ];
  }, [transactions, screeningTransaction]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return displayTransactions.filter(
      (transaction) => {
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

        return (
          matchesSearch &&
          matchesCategory
        );
      },
    );
  }, [
    displayTransactions,
    search,
    category,
  ]);

  const selectedRisk = useMemo(() => {
    if (!selectedTransaction) {
      return null;
    }

    return (
      riskTransactions.find(
        (transaction) =>
          transaction.id ===
          selectedTransaction.id,
      ) ?? null
    );
  }, [
    selectedTransaction,
    riskTransactions,
  ]);

  return (
    <>
      <div className="intro-row">
        <div>
          <h2>Transactions.</h2>

          <p>
            Review activity and inspect individual
            transaction details.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#6e7974",
            fontSize: "10px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#2ad5a4",
              display: "inline-block",
            }}
          />

          {transactions.length} records
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <section
        className="panel"
        style={{
          marginBottom: "18px",
          border: "1px solid #dcefe8",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f4fbf8 100%)",
        }}
      >
        <div
          className="panel-header"
          style={{
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          <div>
            <span className="panel-kicker">
              Live transaction screening
            </span>
            <h3 style={{ marginTop: "4px" }}>
              Analyze a new transaction
            </h3>
            <p
              style={{
                margin: "6px 0 0",
                color: "#87908c",
                fontSize: "10px",
              }}
            >
              Submit a transaction and receive an instant risk decision.
            </p>
          </div>
          <ShieldAlert
            size={20}
            color="#148f70"
            strokeWidth={1.8}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1.4fr 1fr 0.7fr",
            gap: "10px",
            padding: "0 21px 18px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#6e7974",
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Amount
            </label>
            <input
              value={form.amount}
              onChange={(event) =>
                updateForm("amount", event.target.value)
              }
              type="number"
              min="0"
              step="0.01"
              placeholder="8000"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 11px",
                border: "1px solid #dfe6e2",
                borderRadius: "7px",
                background: "#ffffff",
                color: "#17201d",
                fontFamily: "inherit",
                fontSize: "11px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#6e7974",
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Merchant
            </label>
            <input
              value={form.merchant}
              onChange={(event) =>
                updateForm("merchant", event.target.value)
              }
              placeholder="Luxury Store"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 11px",
                border: "1px solid #dfe6e2",
                borderRadius: "7px",
                background: "#ffffff",
                color: "#17201d",
                fontFamily: "inherit",
                fontSize: "11px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#6e7974",
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Category
            </label>
            <select
              value={form.category}
              onChange={(event) =>
                updateForm("category", event.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 11px",
                border: "1px solid #dfe6e2",
                borderRadius: "7px",
                background: "#ffffff",
                color: "#17201d",
                fontFamily: "inherit",
                fontSize: "11px",
                outline: "none",
              }}
            >
              {[
                "Shopping",
                "Food",
                "Travel",
                "Entertainment",
                "Bills",
                "Transfer",
                "Other",
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#6e7974",
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Currency
            </label>
            <select
              value={form.currency}
              onChange={(event) =>
                updateForm("currency", event.target.value)
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 11px",
                border: "1px solid #dfe6e2",
                borderRadius: "7px",
                background: "#ffffff",
                color: "#17201d",
                fontFamily: "inherit",
                fontSize: "11px",
                outline: "none",
              }}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: "10px",
            alignItems: "end",
            padding: "0 21px 20px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#6e7974",
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Location
            </label>
            <input
              value={form.location}
              onChange={(event) =>
                updateForm("location", event.target.value)
              }
              placeholder="Kolkata"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 11px",
                border: "1px solid #dfe6e2",
                borderRadius: "7px",
                background: "#ffffff",
                color: "#17201d",
                fontFamily: "inherit",
                fontSize: "11px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#6e7974",
                fontSize: "9px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Device ID
            </label>
            <input
              value={form.device_id}
              onChange={(event) =>
                updateForm("device_id", event.target.value)
              }
              placeholder="device_001"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 11px",
                border: "1px solid #dfe6e2",
                borderRadius: "7px",
                background: "#ffffff",
                color: "#17201d",
                fontFamily: "inherit",
                fontSize: "11px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleCreateTransaction}
            disabled={isCreating}
            style={{
              minWidth: "165px",
              padding: "11px 16px",
              border: "1px solid #148f70",
              borderRadius: "7px",
              background: "#148f70",
              color: "#ffffff",
              fontFamily: "inherit",
              fontSize: "10px",
              fontWeight: 700,
              cursor: isCreating ? "wait" : "pointer",
              opacity: isCreating ? 0.7 : 1,
            }}
          >
            {isCreating
              ? "Screening..."
              : "Analyze Transaction"}
          </button>
        </div>

        {(createError || createdRisk || screeningTransaction) && (
          <div
            style={{
              margin: "0 21px 20px",
              padding: "15px",
              border: `1px solid ${
                createError
                  ? "#f0d4d4"
                  : createdRiskColor?.background === "#ffebeb"
                    ? "#f0d4d4"
                    : "#dcefe8"
              }`,
              borderRadius: "8px",
              background: createError
                ? "#fff8f8"
                : "#ffffff",
            }}
          >
            {createError ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#c84d4d",
                  fontSize: "10px",
                }}
              >
                <AlertTriangle size={14} />
                {createError}
              </div>
            ) : screeningTransaction ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#87908c",
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Transaction screening
                  </span>
                  <strong
                    style={{
                      display: "block",
                      color: "#17201d",
                      fontSize: "19px",
                    }}
                  >
                    Screening in progress
                  </strong>
                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#6e7974",
                      fontSize: "10px",
                    }}
                  >
                    {screeningTransaction.merchant} · {formatCurrency(
                      screeningTransaction.amount,
                      screeningTransaction.currency,
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      padding: "11px 14px",
                      border: "1px solid #dcefe8",
                      borderRadius: "7px",
                      background: "#f4fbf8",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        color: "#87908c",
                        fontSize: "8px",
                      }}
                    >
                      STATUS
                    </span>
                    <strong
                      style={{
                        color: "#148f70",
                        fontSize: "12px",
                        textTransform: "uppercase",
                      }}
                    >
                      pending
                    </strong>
                  </div>
                </div>
              </div>
            ) : createdRisk ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#87908c",
                      fontSize: "9px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Instant decision
                  </span>
                  <strong
                    style={{
                      display: "block",
                      color: "#17201d",
                      fontSize: "19px",
                    }}
                  >
                    {createdRisk.risk.decision}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#6e7974",
                      fontSize: "10px",
                    }}
                  >
                    {createdRisk.merchant} · {formatCurrency(
                      createdRisk.amount,
                      createdRisk.currency,
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      padding: "11px 14px",
                      border: "1px solid #e4e8e4",
                      borderRadius: "7px",
                      background: "#fafbf9",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        color: "#87908c",
                        fontSize: "8px",
                      }}
                    >
                      RISK SCORE
                    </span>
                    <strong
                      style={{
                        color: "#17201d",
                        fontSize: "18px",
                      }}
                    >
                      {createdRisk.risk.risk_score}/100
                    </strong>
                  </div>

                  <span
                    style={{
                      padding: "7px 10px",
                      borderRadius: "6px",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      ...createdRiskColor,
                    }}
                  >
                    {createdRisk.risk.risk_level}
                  </span>
                </div>

                {createdRisk.risk.reasons.length > 0 && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {createdRisk.risk.reasons.map((reason) => (
                      <span
                        key={reason}
                        style={{
                          padding: "6px 8px",
                          border: "1px solid #eef0ee",
                          borderRadius: "5px",
                          background: "#fafbf9",
                          color: "#53605b",
                          fontSize: "9px",
                        }}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>

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
              Loading transactionsâ€¦
            </div>
          ) : filteredTransactions.length ===
            0 ? (
            <div className="empty-state">
              No transactions match your search.
            </div>
          ) : (
            filteredTransactions.map(
              (transaction) => (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() =>
                    setSelectedTransaction(
                      transaction,
                    )
                  }
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns:
                      "2.2fr 1fr 1.2fr 1fr 0.8fr",
                    alignItems: "center",
                    gap: "18px",
                    padding: "15px 21px",
                    border: 0,
                    borderTop:
                      "1px solid #eef0ee",
                    background:
                      selectedTransaction?.id ===
                      transaction.id
                        ? "#eefaf6"
                        : "#ffffff",
                    color: "#53605b",
                    textAlign: "left",
                    fontFamily: "inherit",
                    fontSize: "11px",
                    cursor: "pointer",
                    transition:
                      "background 160ms ease",
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
                    {formatDate(
                      transaction.timestamp,
                    )}
                  </span>

                  <strong
                    style={{
                      color: "#17201d",
                    }}
                  >
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
                        : transaction.status.toLowerCase() ===
                            "blocked"
                          ? "blocked"
                          : transaction.status.toLowerCase() ===
                              "pending"
                            ? "pending"
                            : "review"
                    }`}
                    style={{
                      textTransform: "uppercase",
                    }}
                  >
                    {transaction.status}
                  </span>
                </button>
              ),
            )
          )}
        </div>
      </section>

      {selectedTransaction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Transaction details"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
            background:
              "rgba(16, 23, 21, 0.18)",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTransaction(null);
            }
          }}
        >
          <aside
            style={{
              width: "min(430px, 100%)",
              height: "100%",
              overflowY: "auto",
              background: "#ffffff",
              borderLeft:
                "1px solid #e4e8e4",
              boxShadow:
                "-16px 0 40px rgba(16, 23, 21, 0.10)",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                padding: "18px 22px",
                background: "#ffffff",
                borderBottom:
                  "1px solid #eef0ee",
              }}
            >
              <div>
                <span className="panel-kicker">
                  Transaction detail
                </span>

                <h3
                  style={{
                    margin: "4px 0 0",
                    color: "#17201d",
                    fontSize: "18px",
                  }}
                >
                  #{selectedTransaction.id}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTransaction(null)
                }
                aria-label="Close transaction details"
                style={{
                  width: "32px",
                  height: "32px",
                  display: "grid",
                  placeItems: "center",
                  border:
                    "1px solid #e4e8e4",
                  borderRadius: "7px",
                  background: "#ffffff",
                  color: "#53605b",
                  cursor: "pointer",
                }}
              >
                <X size={17} />
              </button>
            </div>

            <div
              style={{
                padding: "24px 22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "13px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    display: "grid",
                    placeItems: "center",
                    border:
                      "1px solid #e4e8e4",
                    borderRadius: "10px",
                    background: "#f7f9f7",
                    color: "#17201d",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  {selectedTransaction.merchant
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong
                    style={{
                      display: "block",
                      color: "#17201d",
                      fontSize: "15px",
                    }}
                  >
                    {selectedTransaction.merchant}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: "3px",
                      color: "#87908c",
                      fontSize: "10px",
                    }}
                  >
                    {selectedTransaction.category}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: "18px",
                  border:
                    "1px solid #e4e8e4",
                  borderRadius: "9px",
                  background: "#fafbf9",
                  marginBottom: "18px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: "#87908c",
                    fontSize: "9px",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.12em",
                    marginBottom: "7px",
                  }}
                >
                  Transaction amount
                </span>

                <strong
                  style={{
                    display: "block",
                    color: "#17201d",
                    fontSize: "26px",
                    letterSpacing:
                      "-0.03em",
                  }}
                >
                  {formatCurrency(
                    selectedTransaction.amount,
                    selectedTransaction.currency,
                  )}
                </strong>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "1px",
                  marginBottom: "24px",
                  border:
                    "1px solid #e4e8e4",
                  background: "#e4e8e4",
                }}
              >
                <div
                  style={{
                    padding: "14px",
                    background: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#87908c",
                      fontSize: "9px",
                      marginBottom: "6px",
                    }}
                  >
                    STATUS
                  </span>

                  <strong
                    style={{
                      color: "#17201d",
                      fontSize: "11px",
                    }}
                  >
                    {selectedTransaction.status}
                  </strong>
                </div>

                <div
                  style={{
                    padding: "14px",
                    background: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#87908c",
                      fontSize: "9px",
                      marginBottom: "6px",
                    }}
                  >
                    CATEGORY
                  </span>

                  <strong
                    style={{
                      color: "#17201d",
                      fontSize: "11px",
                    }}
                  >
                    {selectedTransaction.category}
                  </strong>
                </div>

                <div
                  style={{
                    padding: "14px",
                    background: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#87908c",
                      fontSize: "9px",
                      marginBottom: "6px",
                    }}
                  >
                    TIMESTAMP
                  </span>

                  <strong
                    style={{
                      color: "#17201d",
                      fontSize: "11px",
                    }}
                  >
                    {formatDate(
                      selectedTransaction.timestamp,
                    )}
                  </strong>
                </div>

                <div
                  style={{
                    padding: "14px",
                    background: "#ffffff",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#87908c",
                      fontSize: "9px",
                      marginBottom: "6px",
                    }}
                  >
                    USER ID
                  </span>

                  <strong
                    style={{
                      color: "#17201d",
                      fontSize: "11px",
                    }}
                  >
                    {selectedTransaction.user_id}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  marginBottom: "12px",
                }}
              >
                <span className="panel-kicker">
                  Transaction context
                </span>
              </div>

              <div
                style={{
                  borderTop:
                    "1px solid #eef0ee",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding:
                      "12px 0",
                    borderBottom:
                      "1px solid #eef0ee",
                  }}
                >
                  <MapPin
                    size={15}
                    color="#87908c"
                  />

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#87908c",
                        fontSize: "9px",
                      }}
                    >
                      LOCATION
                    </span>

                    <strong
                      style={{
                        color: "#17201d",
                        fontSize: "11px",
                      }}
                    >
                      {selectedTransaction.location ??
                        "Unavailable"}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding:
                      "12px 0",
                    borderBottom:
                      "1px solid #eef0ee",
                  }}
                >
                  <Smartphone
                    size={15}
                    color="#87908c"
                  />

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#87908c",
                        fontSize: "9px",
                      }}
                    >
                      DEVICE
                    </span>

                    <strong
                      style={{
                        color: "#17201d",
                        fontSize: "11px",
                      }}
                    >
                      {selectedTransaction.device_id ??
                        "Unavailable"}
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  marginBottom: "12px",
                }}
              >
                <span className="panel-kicker">
                  Risk assessment
                </span>

                {isRiskLoading && (
                  <span
                    style={{
                      color: "#87908c",
                      fontSize: "9px",
                    }}
                  >
                    Loading…
                  </span>
                )}
              </div>

              {selectedRisk ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: "10px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        padding: "15px",
                        border:
                          "1px solid #e4e8e4",
                        borderRadius: "8px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: "#87908c",
                          fontSize: "9px",
                          marginBottom:
                            "7px",
                        }}
                      >
                        RISK SCORE
                      </span>

                      <strong
                        style={{
                          color: "#17201d",
                          fontSize: "24px",
                        }}
                      >
                        {
                          selectedRisk.risk
                            .risk_score
                        }
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: "15px",
                        border:
                          "1px solid #e4e8e4",
                        borderRadius: "8px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: "#87908c",
                          fontSize: "9px",
                          marginBottom:
                            "7px",
                        }}
                      >
                        LEVEL
                      </span>

                      <span
                        style={{
                          display:
                            "inline-flex",
                          padding:
                            "4px 7px",
                          borderRadius:
                            "5px",
                          fontSize:
                            "9px",
                          fontWeight: 700,
                          letterSpacing:
                            "0.05em",
                          ...getRiskColor(
                            selectedRisk
                              .risk
                              .risk_level,
                          ),
                        }}
                      >
                        {
                          selectedRisk.risk
                            .risk_level
                        }
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "15px",
                      border:
                        "1px solid #e4e8e4",
                      borderRadius: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: "#87908c",
                        fontSize: "9px",
                        marginBottom:
                          "7px",
                      }}
                    >
                      DECISION
                    </span>

                    <strong
                      style={{
                        color: "#17201d",
                        fontSize: "14px",
                      }}
                    >
                      {
                        selectedRisk.risk
                          .decision
                      }
                    </strong>
                  </div>

                  <div
                    style={{
                      borderTop:
                        "1px solid #eef0ee",
                    }}
                  >
                    {selectedRisk.risk
                      .reasons.length ===
                    0 ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: "8px",
                          padding:
                            "14px 0",
                          color:
                            "#6e7974",
                          fontSize:
                            "10px",
                        }}
                      >
                        <CheckCircle2
                          size={14}
                          color="#2ad5a4"
                        />

                        No elevated risk
                        signals detected.
                      </div>
                    ) : (
                      selectedRisk.risk.reasons.map(
                        (reason) => (
                          <div
                            key={reason}
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "flex-start",
                              gap: "9px",
                              padding:
                                "12px 0",
                              borderBottom:
                                "1px solid #eef0ee",
                              color:
                                "#53605b",
                              fontSize:
                                "10px",
                              lineHeight:
                                1.5,
                            }}
                          >
                            <AlertTriangle
                              size={14}
                              color="#e6a33b"
                              style={{
                                flexShrink: 0,
                                marginTop:
                                  "1px",
                              }}
                            />

                            <span>
                              {reason}
                            </span>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </>
              ) : selectedTransaction.status.toLowerCase() ===
                "pending" ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "15px",
                    border:
                      "1px solid #dcefe8",
                    borderRadius: "8px",
                    background: "#f4fbf8",
                    color: "#148f70",
                    fontSize: "10px",
                  }}
                >
                  <ShieldAlert size={14} />
                  Risk assessment is currently in progress.
                </div>
              ) : !isRiskLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "15px",
                    border:
                      "1px solid #e4e8e4",
                    borderRadius: "8px",
                    color: "#87908c",
                    fontSize: "10px",
                  }}
                >
                  <CircleX size={14} />
                  Risk assessment unavailable.
                </div>
              ) : null}

              <button
                type="button"
                onClick={() =>
                  setSelectedTransaction(null)
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap: "7px",
                  marginTop: "24px",
                  padding: "11px",
                  border:
                    "1px solid #e4e8e4",
                  borderRadius: "7px",
                  background: "#ffffff",
                  color: "#53605b",
                  fontFamily: "inherit",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                Close details
                <ChevronRight size={13} />
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default Transactions;