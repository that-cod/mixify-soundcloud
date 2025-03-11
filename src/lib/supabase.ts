
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://grfcpgxwmjpvnliqqyfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmNwZ3h3bWpwdm5saXFxeWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2ODQzNTIsImV4cCI6MjA1NzI2MDM1Mn0.JIOrKUJSalHaZsUCrS-sBeIrBPKvjWFngXecEjCyoSw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
