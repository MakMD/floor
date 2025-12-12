// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Вставте сюди ваші дані зі сторінки API в Supabase
const supabaseUrl = "https://gathmalwzudethsowswq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhdGhtYWx3enVkZXRoc293c3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3ODg5OTMsImV4cCI6MjA3MzM2NDk5M30.fAIeVfaMFo11gCU-LULxRxTpd41s9lNqYwt9daidu_4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
