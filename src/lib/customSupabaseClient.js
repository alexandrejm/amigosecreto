import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://guztfaaxffaxhxeixaca.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1enRmYWF4ZmZheGh4ZWl4YWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODc4MjksImV4cCI6MjA3ODQ2MzgyOX0.wnfig8oEel9ed03kAwexV2weJqPbp_ay7kNWD2senDw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);