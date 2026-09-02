// src/services/workTypeService.js
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

/**
 * Допоміжна функція для створення локальної дати з рядка YYYY-MM-DD
 * Щоб уникнути проблем з часовими поясами (зсув на попередній день)
 */
const createLocalDate = (dateString) => {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Finds or creates an invoice table for a person based on a date.
 * @param {string} personId - The ID of the person.
 * @param {Date} date - The date to determine the table name.
 * @returns {object} The found or newly created invoice table object.
 */
const findOrCreateInvoiceTable = async (personId, date) => {
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  const day = date.getDate();

  let tableName;
  if (day <= 15) {
    tableName = `${month} 1-15 ${year}`;
  } else {
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    tableName = `${month} 16-${lastDay} ${year}`;
  }

  const { data: existingTable, error: findError } = await supabase
    .from("invoice_tables")
    .select("id")
    .eq("person_id", personId)
    .eq("name", tableName)
    .single();

  if (findError && findError.code !== "PGRST116") {
    throw findError;
  }

  if (existingTable) {
    return existingTable;
  }

  const { data: newTable, error: createError } = await supabase
    .from("invoice_tables")
    .insert({ person_id: personId, name: tableName })
    .select("id")
    .single();

  if (createError) {
    throw createError;
  }
  return newTable;
};

/**
 * Creates a work type and its corresponding invoice.
 */
export const addWorkTypeAndInvoice = async (workTypeData) => {
  // 1. Create the work type
  const { data: newWorkType, error: workTypeError } = await supabase
    .from("work_types")
    .insert(workTypeData)
    .select("*, work_type_templates(name), people(name)")
    .single();

  if (workTypeError) {
    toast.error(workTypeError.message);
    return null;
  }

  // 2. If a person is assigned, create/update their invoice
  if (newWorkType.person_id) {
    const { data: address } = await supabase
      .from("addresses")
      .select("date, address, store_id")
      .eq("id", newWorkType.address_id)
      .single();

    const table = await findOrCreateInvoiceTable(
      newWorkType.person_id,
      createLocalDate(address.date),
    );

    const { error: invoiceError } = await supabase.from("invoices").insert({
      invoice_table_id: table.id,
      address: address.address,
      date: address.date,
      total_income: newWorkType.payment_amount,
      work_type_id: newWorkType.id,
      store_id: address.store_id,
    });

    if (invoiceError) {
      toast.error(`Invoice creation failed: ${invoiceError.message}`);
    }
  }
  toast.success("Work type added!");
  return newWorkType;
};

/**
 * Updates a work type and its corresponding invoice.
 */
export const updateWorkTypeAndInvoice = async (workType) => {
  // 1. Оновлюємо саму роботу (включно з НОТАТКАМИ, щоб вони не губилися)
  const { error: workTypeError } = await supabase
    .from("work_types")
    .update({
      work_type_template_id: workType.work_type_template_id,
      person_id: workType.person_id || null,
      payment_amount: workType.payment_amount,
      notes: workType.notes,
    })
    .eq("id", workType.id);

  if (workTypeError) {
    toast.error(workTypeError.message);
    return false;
  }

  // 2. Шукаємо існуючий інвойс для цієї роботи
  const { data: existingInvoice, error: findError } = await supabase
    .from("invoices")
    .select("id")
    .eq("work_type_id", workType.id)
    .maybeSingle();

  if (findError) {
    console.error("Error finding invoice:", findError);
  }

  // 3. Логіка створення / оновлення / видалення інвойсу
  if (!workType.person_id) {
    // Якщо працівника відкріпили, але інвойс був — видаляємо його
    if (existingInvoice) {
      await supabase.from("invoices").delete().eq("id", existingInvoice.id);
    }
  } else {
    // Працівник прикріплений (новий або існуючий)
    const { data: address } = await supabase
      .from("addresses")
      .select("date, address, store_id")
      .eq("id", workType.address_id)
      .single();

    // Знаходимо або створюємо папку (таблицю інвойсів) для ЦІЄЇ людини і ЦІЄЇ дати
    const table = await findOrCreateInvoiceTable(
      workType.person_id,
      createLocalDate(address.date),
    );

    if (existingInvoice) {
      // Якщо інвойс був — оновлюємо папку (на випадок зміни працівника) та суму
      const { error: updateInvoiceError } = await supabase
        .from("invoices")
        .update({
          invoice_table_id: table.id,
          total_income: workType.payment_amount,
        })
        .eq("id", existingInvoice.id);

      if (updateInvoiceError) {
        toast.error(`Invoice update failed: ${updateInvoiceError.message}`);
        return false;
      }
    } else {
      // Якщо інвойсу не було (додали людину до роботи вперше) — створюємо його!
      const { error: insertInvoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_table_id: table.id,
          address: address.address,
          date: address.date,
          total_income: workType.payment_amount,
          work_type_id: workType.id,
          store_id: address.store_id,
        });

      if (insertInvoiceError) {
        toast.error(`Invoice creation failed: ${insertInvoiceError.message}`);
        return false;
      }
    }
  }

  return true;
};

/**
 * Deletes a work type and its corresponding invoice.
 */
export const deleteWorkTypeAndInvoice = async (workTypeId) => {
  const { error: invoiceError } = await supabase
    .from("invoices")
    .delete()
    .eq("work_type_id", workTypeId);

  if (invoiceError) {
    toast.error(`Could not delete associated invoice: ${invoiceError.message}`);
    return;
  }

  const { error: workTypeError } = await supabase
    .from("work_types")
    .delete()
    .eq("id", workTypeId);

  if (workTypeError) {
    toast.error(workTypeError.message);
  } else {
    toast.success("Work type and invoice deleted.");
  }
};
