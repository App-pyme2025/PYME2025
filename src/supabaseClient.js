// src/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://nyzlexsevgdwxgsarsfm.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55emxleHNldmdkd3hnc2Fyc2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0OTA2NTEsImV4cCI6MjA2OTA2NjY1MX0.ZOKdhOvtaalHNOYTUDAGy4aO65tJ50L0VQcJk1Vl_Co';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);