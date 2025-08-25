import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import config from "./config";

dotenv.config();

const supabase = createClient(
config.SUPABASE_URL ?? "",
  config.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

async function seedCustomers() {
  const { data, error } = await supabase
    .from("Customers")
    .insert([
      { name: "Alice Johnson", email: "alice@example.com", mobile_number: "+15551112222" },
      { name: "Bob Smith", email: "bob@example.com", mobile_number: "+15553334444" },
      { name: "Charlie Brown", email: "charlie@example.com", mobile_number: "+15556667777" },
      { name: "Diana Prince", email: "diana@example.com", mobile_number: "+15559998888" },
    ])
    .select();

  if (error) {
    console.error("Error seeding:", error.message);
  } else {
    console.log("Seeded customers:", data);
  }
}

seedCustomers();
