// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Вставте сюди ваші дані зі сторінки API в Supabase
const supabaseUrl = "https://gathmalwzudethsowswq.supabase.co";
const supabaseAnonKey = "sb_publishable_rvpdLbr_Pwp3Z9w-El9jLA_xNQ48oEQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
