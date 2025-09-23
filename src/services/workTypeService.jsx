// src/services/workTypeService.js
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

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
  const tableName =
    day <= 15 ? `${month} 1-15 ${year}` : `${month} 16-30 ${year}`;

  const { data: existingTable, error: findError } = await supabase
    .from("invoice_tables")
    .select("id")
    .eq("person_id", personId)
    .eq("name", tableName)
    .single();

  if (findError && findError.code !== "PGRST116") {
    // PGRST116 means no rows found, which is fine.
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
      .select("date, address")
      .eq("id", newWorkType.address_id)
      .single();

    const table = await findOrCreateInvoiceTable(
      newWorkType.person_id,
      new Date(address.date)
    );

    const { error: invoiceError } = await supabase.from("invoices").insert({
      invoice_table_id: table.id,
      address: address.address,
      date: address.date,
      total_income: newWorkType.payment_amount,
      work_type_id: newWorkType.id, // Link to the work type
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
  // 1. Update the work type
  const { error: workTypeError } = await supabase
    .from("work_types")
    .update({
      work_type_template_id: workType.work_type_template_id,
      person_id: workType.person_id || null,
      payment_amount: workType.payment_amount,
    })
    .eq("id", workType.id);

  if (workTypeError) {
    toast.error(workTypeError.message);
    return;
  }

  // 2. Find the existing invoice linked to this work type
  const { data: existingInvoice, error: findError } = await supabase
    .from("invoices")
    .select("id")
    .eq("work_type_id", workType.id)
    .maybeSingle(); // Use maybeSingle to not error if not found

  if (findError) {
    toast.error(`Error finding invoice: ${findError.message}`);
    return;
  }

  // 3. Update the invoice
  if (existingInvoice) {
    const { error: updateInvoiceError } = await supabase
      .from("invoices")
      .update({ total_income: workType.payment_amount })
      .eq("id", existingInvoice.id);

    if (updateInvoiceError) {
      toast.error(`Invoice update failed: ${updateInvoiceError.message}`);
    }
  }

  toast.success("Work type saved!");
};

/**
 * Deletes a work type and its corresponding invoice.
 */
export const deleteWorkTypeAndInvoice = async (workTypeId) => {
  // The foreign key on `invoices` is ON DELETE SET NULL, so we delete manually.

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
