// src/services/invoiceService.js

import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

/**
 * Генерує назву таблиці інвойсів на основі дати.
 * @param {Date} date - Об'єкт Date.
 * @returns {string} Назва таблиці, напр. "September 16-30 2025".
 */
const getInvoiceTableNameForDate = (date) => {
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  const day = date.getDate();

  if (day <= 15) {
    return `${month} 1-15 ${year}`;
  } else {
    const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
    return `${month} 16-${lastDay} ${year}`;
  }
};

/**
 * Додає інвойс для працівника, створюючи або оновлюючи відповідну таблицю.
 * @param {string} workerId - ID працівника.
 * @param {object} addressData - Об'єкт з даними адреси ({ address, date }).
 */
export const addInvoiceForWorker = async (workerId, addressData) => {
  try {
    const { data: personData, error: personError } = await supabase
      .from("people")
      .select("name, tables")
      .eq("id", workerId)
      .single();

    if (personError) throw personError;

    const personTables = personData.tables || [];
    const invoiceDate = new Date(addressData.date);
    const tableName = getInvoiceTableNameForDate(invoiceDate);

    const newInvoice = {
      address: addressData.address,
      date: addressData.date,
      total_income: 0,
    };

    const tableExists = personTables.some((table) => table.name === tableName);
    let updatedTables;

    if (tableExists) {
      updatedTables = personTables.map((table) => {
        if (table.name === tableName) {
          const invoiceAlreadyExists = (table.invoices || []).some(
            (inv) =>
              inv.address === newInvoice.address && inv.date === newInvoice.date
          );
          if (!invoiceAlreadyExists) {
            return {
              ...table,
              invoices: [...(table.invoices || []), newInvoice],
            };
          }
        }
        return table;
      });
    } else {
      const newTable = {
        tableId: `${Date.now()}_${Math.random()}`,
        name: tableName,
        invoices: [newInvoice],
      };
      updatedTables = [...personTables, newTable];
    }

    const { error: updateError } = await supabase
      .from("people")
      .update({ tables: updatedTables })
      .eq("id", workerId);

    if (updateError) throw updateError;

    toast.success(
      `Invoice for ${personData.name} added to table "${tableName}"`
    );
  } catch (error) {
    console.error("Error creating invoice for worker:", error);
    toast.error(error.message || "Could not create invoice for worker.");
  }
};

/**
 * Видаляє порожній інвойс для працівника.
 * @param {string} workerId - ID працівника.
 * @param {object} addressData - Об'єкт з даними адреси ({ address, date }).
 */
export const removeInvoiceForWorker = async (workerId, addressData) => {
  try {
    const { data: personData, error: personError } = await supabase
      .from("people")
      .select("name, tables")
      .eq("id", workerId)
      .single();

    if (personError) throw personError;

    const personTables = personData.tables || [];
    const invoiceDate = new Date(addressData.date);
    const tableName = getInvoiceTableNameForDate(invoiceDate);

    let wasInvoiceRemoved = false;

    const updatedTables = personTables.map((table) => {
      if (table.name === tableName) {
        const initialInvoiceCount = (table.invoices || []).length;

        const filteredInvoices = (table.invoices || []).filter((inv) => {
          const isMatch =
            inv.address === addressData.address &&
            inv.date === addressData.date;
          // Видаляємо тільки якщо це потрібний інвойс І його дохід дорівнює 0
          return !(
            isMatch &&
            (inv.total_income === 0 || inv.total_income === null)
          );
        });

        if (filteredInvoices.length < initialInvoiceCount) {
          wasInvoiceRemoved = true;
        }

        return { ...table, invoices: filteredInvoices };
      }
      return table;
    });

    // Оновлюємо дані тільки якщо інвойс було фактично видалено
    if (wasInvoiceRemoved) {
      const { error: updateError } = await supabase
        .from("people")
        .update({ tables: updatedTables })
        .eq("id", workerId);

      if (updateError) throw updateError;

      toast.success(
        `Empty invoice for ${personData.name} removed from table "${tableName}"`
      );
    }
  } catch (error) {
    console.error("Error removing invoice for worker:", error);
    toast.error(error.message || "Could not remove invoice for worker.");
  }
};
