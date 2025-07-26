import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nyzlexsevgdwxgsarsfm.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55emxleHNldmdkd3hnc2Fyc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0OTA2NTEsImV4cCI6MjA2OTA2NjY1MX0.ZOKdhOvtaalHNOYTUDAGy4aO65tJ50L0VQcJk1Vl_Co"; 
export const supabase = createClient(supabaseUrl, supabaseKey);