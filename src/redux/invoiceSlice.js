import { createSlice } from "@reduxjs/toolkit";

const invoiceSlice = createSlice({
  name: "invoices",
  initialState: {
    tables: {},
    selectedTable: null,
  },
  reducers: {
    setTables(state, action) {
      state.tables = action.payload;
    },
    selectTable(state, action) {
      state.selectedTable = action.payload;
    },
  },
});

export const { setTables, selectTable } = invoiceSlice.actions;
export default invoiceSlice.reducer;
