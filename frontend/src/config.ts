const productionApiUrl =
  "https://finpulse-backend-0b3p.onrender.com/api/v1";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || productionApiUrl;

export const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL ||
  `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;

export const TRANSACTIONS_WS_URL =
  `${WS_BASE_URL}/ws/transactions`;