import { createClient } from "@supabase/supabase-js";


// dotenv.config();
export const statuses = {
  0: "Ordered",
  1: "Ready for Pickup",
  2: "Scheduled for Delivery",
  3: "Delivered", 4: "Cancelled"
}
const supabase = createClient(
  "https://uoxeennwulrgbaitqnub.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVveGVlbm53dWxyZ2JhaXRxbnViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkyOTkyNSwiZXhwIjoyMDcxNTA1OTI1fQ.xaqIfkvu_CbillQzVqGOKnPniPqUoePK_C6XoQaZiOA"
);

// --- Get customer by ID ---
export async function getCustomerById(customer_id: number) {
  const { data, error } = await supabase
    .from("Customers")
    .select("id, name, email, mobile_number,status")
    .eq("id", customer_id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// --- Get customer by MobileNumber ---
export async function getCustomerByMobile(mobile_number: number) {
  const { data, error } = await supabase
    .from("Customers")
    .select("id, name, email, mobile_number,status")
    .eq("mobile_number", mobile_number)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// --- Get all customers ---
export async function getAllCustomers() {
  const { data, error } = await supabase
    .from("Customers")
    .select("id, name, email, mobile_number, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}


// // --- Save history entry ---
// export async function saveHistory(customer_id : number, message?: string) {
//   const { data, error } = await supabase
//     .from("History")
//     .insert([{ customer_id}])
//     .select();

//   if (error) throw new Error(error.message);
//   return data[0];
// }
