// src/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://hcothkyelfhoveehjfhc.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhjb3Roa3llbGZob3ZlZWhqZmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NzY0NjIsImV4cCI6MjA2OTA1MjQ2Mn0.C4Kowt9AvLCah04QN0CF0Dhb7TuPinZIGkHlKTgyDnw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);