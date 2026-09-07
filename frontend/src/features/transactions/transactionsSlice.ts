import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import { getUserTransactions } from "../../services/api";
import type { Transaction } from "../../types/transaction";

interface TransactionsState {
  items: Transaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchUserTransactions = createAsyncThunk(
  "transactions/fetchUserTransactions",
  async (userId: number) => {
    return getUserTransactions(userId);
  },
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    clearTransactions(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchUserTransactions.pending,
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addCase(
        fetchUserTransactions.fulfilled,
        (state, action) => {
          state.isLoading = false;
          state.items = action.payload;
        },
      )
      .addCase(
        fetchUserTransactions.rejected,
        (state, action) => {
          state.isLoading = false;
          state.error =
            action.error.message ??
            "Unable to load transactions.";
        },
      );
  },
});

export const { clearTransactions } =
  transactionsSlice.actions;

export default transactionsSlice.reducer;