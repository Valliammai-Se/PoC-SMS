import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_KEY ?? ""
);

// --- Get customer by ID ---
export async function getCustomerById(customer_id: number) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("id", customer_id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// --- Get customer by MobileNumber ---
export async function getCustomerByMobile(mobile_number: number) {
  const { data, error } = await supabase
    .from("Customers")
    .select("id, name, email, phone")
    .eq("mobile_number", mobile_number)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// --- Get all customers ---
export async function getAllCustomers() {
  const { data, error } = await supabase
    .from("Customers")
    .select("id, name, email, phone, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}


// --- Save history entry ---
export async function saveHistory(customer_id : number, message?: string) {
  const { data, error } = await supabase
    .from("History")
    .insert([{ customer_id}])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
}
