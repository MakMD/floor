// src/services/workTypeService.jsx

import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

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

export const addWorkTypeAndInvoice = async (workTypeData) => {
  const { data: newWorkType, error: workTypeError } = await supabase
    .from("work_types")
    .insert(workTypeData)
    .select("*, work_type_templates(name), people(name)")
    .single();

  if (workTypeError) {
    toast.error(workTypeError.message);
    return null;
  }

  if (newWorkType.person_id) {
    const { data: address } = await supabase
      .from("addresses")
      .select("date, address, store_id") // ОНОВЛЕНО: Отримуємо store_id
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
      work_type_id: newWorkType.id,
      store_id: address.store_id, // ОНОВЛЕНО: Додаємо store_id
    });

    if (invoiceError) {
      toast.error(`Invoice creation failed: ${invoiceError.message}`);
    }
  }
  toast.success("Work type added!");
  return newWorkType;
};

export const updateWorkTypeAndInvoice = async (workType) => {
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

  const { data: existingInvoice, error: findError } = await supabase
    .from("invoices")
    .select("id")
    .eq("work_type_id", workType.id)
    .maybeSingle();

  if (findError) {
    toast.error(`Error finding invoice: ${findError.message}`);
    return;
  }

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
